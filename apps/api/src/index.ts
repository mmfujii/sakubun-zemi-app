import { serve } from "@hono/node-server";
import { zValidator } from "@hono/zod-validator";
import {
  checkContentSafety,
  EssaySubmitSchema,
  OcrRequestSchema,
  ProfileUpdateSchema,
} from "@sakubun-zemi/schemas";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { getUser, getUserId } from "./auth";
import { prisma } from "./db";
import { generateFeedback } from "./feedback";
import { ocrImages } from "./ocr";
import { checkQuota, QUOTA_ENABLED } from "./quota";
import { getStripe, STRIPE_ENABLED } from "./stripe";
import { stripeRoutes } from "./stripe-routes";

// AWS では ALB が /api/* をこのAPIへ振り分けるため、API自身も /api 配下で応答させる。
// API_BASE_PATH=/api を実行時に注入（ローカルは未設定 → "/" ＝ prefix なしで従来どおり）。
const app = new Hono().basePath(process.env.API_BASE_PATH ?? "/");

// CORS 許可オリジン。ローカルは localhost:3000、AWS は同一オリジン（ALB）なので
// 実質 CORS は発生しないが、将来のドメイン分割に備えて env で差し替え可能にしておく。
app.use(
  "/*",
  cors({
    origin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
    allowMethods: ["GET", "POST", "PUT", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  }),
);

app.get("/", (c) => c.json({ ok: true, service: "sakubun-zemi-api" }));

// お題一覧をDBから取得して返す（フロントの PromptsResponseSchema に合わせた形）
app.get("/prompts", async (c) => {
  // Prisma: Prompt テーブルから isActive=true の行を、作成順で全件取得
  const prompts = await prisma.prompt.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
  });

  // DBの行から、フロントが欲しい項目だけに整形（isActive/createdAt は返さない）
  return c.json({
    prompts: prompts.map((p) => ({
      id: p.id,
      title: p.title,
      body: p.body,
      category: p.category,
    })),
  });
});

// お題の詳細を1件返す（フロントの PromptSchema の形＝単体オブジェクト）。
// 一覧と同じく isActive のものだけ。無ければ 404（フロントは「お題が見つかりません」表示）。
app.get("/prompts/:id", async (c) => {
  const id = c.req.param("id");
  const prompt = await prisma.prompt.findFirst({
    where: { id, isActive: true },
  });
  if (!prompt) {
    return c.json({ error: "Prompt not found" }, 404);
  }
  return c.json({
    id: prompt.id,
    title: prompt.title,
    body: prompt.body,
    category: prompt.category,
  });
});

// ユーザーの添削履歴をDBから集計して返す（HistoryResponseSchema の形）
app.get("/history", async (c) => {
  const userId = await getUserId(c); // Bearerトークンを検証してユーザーID取得（無効なら401）

  // ユーザーの作文を新しい順で取得。feedback(点数)と prompt(お題)も一緒に取る（include = JOIN）
  const submissions = await prisma.submission.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { feedback: true, prompt: true },
  });

  // DBの行を、フロントが欲しい形(HistoryItem)に整形
  const items = submissions.map((s) => ({
    id: s.id,
    title: s.prompt?.title ?? s.theme, // お題があればその題、無ければ theme
    createdAt: s.createdAt.toISOString(), // DateTime → ISO文字列
    score: s.feedback?.overallScore ?? 0, // 添削がまだ無ければ 0
    category: s.prompt?.category ?? null,
  }));

  // 集計
  const totalCount = items.length;
  const avgScore =
    totalCount > 0
      ? Math.round((items.reduce((sum, i) => sum + i.score, 0) / totalCount) * 10) / 10
      : null;

  return c.json({ totalCount, avgScore, items });
});

// ダッシュボードのサマリーを返す（DashboardSummary の形）
app.get("/dashboard", async (c) => {
  const user = await getUser(c); // 認証（id＋email）

  // 表示名は Profile.displayName 優先、無ければメールの@前、それも無ければ「ゲスト」
  const profile = await prisma.profile.findUnique({ where: { id: user.id } });
  const userName = profile?.displayName ?? user.email?.split("@")[0] ?? "ゲスト";

  // ユーザーの作文を新しい順に取得し、添削済み（feedbackあり）だけJS側で絞る
  const submissions = await prisma.submission.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { feedback: true, prompt: true },
  });

  const scored = submissions
    .filter((s) => s.feedback !== null)
    .map((s) => ({
      id: s.id,
      title: s.prompt?.title ?? s.theme,
      createdAt: s.createdAt.toISOString(),
      score: s.feedback?.overallScore ?? 0,
    }));

  const totalCount = scored.length;
  const avgScore =
    totalCount > 0
      ? Math.round((scored.reduce((sum, s) => sum + s.score, 0) / totalCount) * 10) / 10
      : null;

  // トレンド = 直近スコア − それ以前の平均（2件以上で算出）
  let scoreTrend: { diff: number } | null = null;
  if (totalCount >= 2) {
    const latest = scored[0].score;
    const prev = scored.slice(1);
    const prevAvg = prev.reduce((sum, s) => sum + s.score, 0) / prev.length;
    scoreTrend = { diff: Math.round((latest - prevAvg) * 10) / 10 };
  }

  return c.json({
    userName,
    totalCount,
    avgScore,
    scoreTrend,
    recentSubmissions: scored.slice(0, 3),
  });
});

// 添削結果1件を返す（SubmissionDetail の形）
app.get("/submissions/:id", async (c) => {
  const userId = await getUserId(c); // 認証
  const id = c.req.param("id"); // URLの :id を取得

  // id だけでなく userId でも縛る＝他人の作文IDを直打ちしても取れない
  const sub = await prisma.submission.findFirst({
    where: { id, userId },
    include: { feedback: true, prompt: true }, // 関連も一緒に
  });

  // 見つからない（=自分のでない含む）or 添削がまだ無い → 404
  if (!sub?.feedback) {
    return c.json({ error: "not found" }, 404);
  }

  // result(Json)には scores/child/parent/grammarNotes/kanjiNotes が入っている
  const result = sub.feedback.result as Record<string, unknown>;

  return c.json({
    id: sub.id,
    title: sub.prompt?.title ?? sub.theme,
    rawText: sub.rawText,
    createdAt: sub.createdAt.toISOString(),
    score: sub.feedback.overallScore,
    ...result, // scores/child/parent/grammarNotes/kanjiNotes を展開
  });
});

// 添削の残り回数（quota）を返す。enabled=false は課金無効環境。
app.get("/quota", async (c) => {
  const userId = await getUserId(c);
  if (!QUOTA_ENABLED) {
    return c.json({
      canSubmit: true,
      plan: "free",
      used: 0,
      limit: 0,
      remaining: 0,
      ticketBalance: 0,
      willUseTicket: false,
      cancelAtPeriodEnd: false,
      currentPeriodEnd: null,
      enabled: false,
    });
  }
  const quota = await checkQuota(userId);
  return c.json({ ...quota, enabled: true });
});

// お子さま情報を取得（無ければ空のProfileを作って返す）
app.get("/profile", async (c) => {
  const userId = await getUserId(c);
  const profile = await prisma.profile.upsert({
    where: { id: userId },
    update: {},
    create: { id: userId },
  });
  return c.json({
    displayName: profile.displayName,
    childName: profile.childName,
    grade: profile.grade,
    targetSchool: profile.targetSchool,
  });
});

// お子さま情報を更新（名前/学年/志望校。未設定はnullで送る）
app.put("/profile", zValidator("json", ProfileUpdateSchema), async (c) => {
  const userId = await getUserId(c);
  const body = c.req.valid("json");
  const profile = await prisma.profile.upsert({
    where: { id: userId },
    update: {
      childName: body.childName,
      grade: body.grade,
      targetSchool: body.targetSchool,
    },
    create: {
      id: userId,
      childName: body.childName,
      grade: body.grade,
      targetSchool: body.targetSchool,
    },
  });
  return c.json({
    displayName: profile.displayName,
    childName: profile.childName,
    grade: profile.grade,
    targetSchool: profile.targetSchool,
  });
});

app.post("/essays", zValidator("json", EssaySubmitSchema), async (c) => {
  const userId = await getUserId(c); // 認証：投稿者＝ログイン中ユーザー
  const body = c.req.valid("json"); // { theme, text, promptId? }

  // コンテンツ安全チェック（子ども向け。不適切表現はブロック）
  const safety = checkContentSafety(body.text);
  if (safety.blocked) {
    return c.json({ error: safety.reason, code: "CONTENT_BLOCKED" }, 400);
  }

  // 外部キー制約のため、ユーザーのProfile行を用意（無ければ作る）。子情報も取得して添削に使う
  const profile = await prisma.profile.upsert({
    where: { id: userId },
    update: {},
    create: { id: userId },
  });

  // 課金ゲート（QUOTA_ENABLED時のみ）。上限到達なら作文を作らず402で返す
  const quota = QUOTA_ENABLED ? await checkQuota(userId) : null;
  if (quota && !quota.canSubmit) {
    return c.json(
      {
        error: "添削の上限に達しました。プランのアップグレードかチケットをご検討ください",
        code: "QUOTA_EXCEEDED",
      },
      402,
    );
  }

  // お題から書いた場合は、お題本文をDBから引いてプロンプトに渡す
  const prompt = body.promptId
    ? await prisma.prompt.findUnique({ where: { id: body.promptId } })
    : null;

  // 1. 作文をDBに1件保存（INSERT）。まず status=pending で作る
  const submission = await prisma.submission.create({
    data: {
      userId,
      theme: body.theme,
      rawText: body.text,
      status: "pending",
      // お題が見つかればそのIDを紐付け（履歴にお題タイトル/カテゴリが出る）
      promptId: prompt?.id,
    },
  });

  try {
    // 2. Claudeで添削（DBトランザクション外。時間がかかるため）
    const { overallScore, result } = await generateFeedback({
      theme: body.theme,
      text: body.text,
      promptTitle: prompt?.title,
      promptBody: prompt?.body,
      targetLengthMin: body.targetLengthMin,
      targetLengthMax: body.targetLengthMax,
      childName: profile.childName ?? undefined,
      grade: profile.grade ?? undefined,
      targetSchool: profile.targetSchool ?? undefined,
    });

    // 3. 添削結果を保存し、作文を完了状態に
    await prisma.feedback.create({
      data: {
        submissionId: submission.id,
        overallScore,
        result, // Json列にcamelCaseのresultをそのまま保存
      },
    });
    await prisma.submission.update({
      where: { id: submission.id },
      data: { status: "completed" },
    });

    // 月上限を超えた分はチケットを1枚消費
    if (quota?.willUseTicket) {
      await prisma.subscription.update({
        where: { userId },
        data: { ticketBalance: { decrement: 1 } },
      });
    }

    // 4. 結果画面へ遷移するための submissionId を返す
    return c.json({ submissionId: submission.id });
  } catch (e) {
    // 添削に失敗したら status=error にして500
    console.error("添削生成に失敗:", e);
    await prisma.submission.update({
      where: { id: submission.id },
      data: { status: "error" },
    });
    return c.json({ error: "添削の生成に失敗しました。もう一度お試しください" }, 500);
  }
});

// 写真をClaude visionで文字起こしして返す（画像は保存しない＝メモリ処理のみ）。
// フロントは返ってきた text を編集してから /essays に提出する。
app.post("/ocr", zValidator("json", OcrRequestSchema), async (c) => {
  await getUserId(c); // 認証：ログイン中ユーザーのみ
  const { images } = c.req.valid("json");

  try {
    const text = await ocrImages(images);
    return c.json({ text });
  } catch (e) {
    console.error("OCRに失敗:", e);
    return c.json({ error: "文字起こしに失敗しました。もう一度お試しください" }, 500);
  }
});

// アカウント削除（退会）: Stripeサブスク解約 → 関連データ削除 → Supabase Authユーザー削除
app.post("/account/delete", async (c) => {
  const userId = await getUserId(c);
  try {
    // 1. Stripeサブスクをキャンセル（あれば）
    const sub = await prisma.subscription.findUnique({ where: { userId } });
    if (sub?.stripeSubscriptionId && STRIPE_ENABLED) {
      try {
        await getStripe().subscriptions.cancel(sub.stripeSubscriptionId);
      } catch (e) {
        console.warn("退会: Stripe解約をスキップ:", e);
      }
    }

    // 2. 関連データ削除（Feedbackは Submission の onDelete: Cascade で消える）
    await prisma.submission.deleteMany({ where: { userId } });
    await prisma.subscription.deleteMany({ where: { userId } });
    await prisma.profile.deleteMany({ where: { id: userId } });

    // 3. Supabase Auth のユーザーを削除（service role が必要）
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.SUPABASE_URL;
    if (!serviceKey || !supabaseUrl) {
      return c.json(
        { error: "退会処理の設定が未完了です（SUPABASE_SERVICE_ROLE_KEY 未設定）" },
        500,
      );
    }
    const res = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
      method: "DELETE",
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
    });
    if (!res.ok) {
      console.error("退会: Authユーザー削除に失敗", res.status, await res.text().catch(() => ""));
      return c.json({ error: "アカウントの削除に失敗しました" }, 500);
    }

    return c.json({ success: true });
  } catch (e) {
    console.error("退会: 失敗", e);
    return c.json({ error: "アカウントの削除に失敗しました" }, 500);
  }
});

// Stripe（サブスク/チケット/ポータル）
app.route("/stripe", stripeRoutes);

const port = Number(process.env.PORT ?? 3001);
serve({ fetch: app.fetch, port });
console.log(`API listening on http://localhost:${port}`);

export default app;
