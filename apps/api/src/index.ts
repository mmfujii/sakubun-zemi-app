import { serve } from "@hono/node-server";
import { zValidator } from "@hono/zod-validator";
import { EssaySubmitSchema } from "@sakubun-zemi/schemas";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { getUserId } from "./auth";
import { prisma } from "./db";
import { generateFeedback } from "./feedback";

const app = new Hono();

app.use(
  "/*",
  cors({
    origin: "http://localhost:3000",
    allowMethods: ["GET", "POST", "OPTIONS"],
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

app.post("/essays", zValidator("json", EssaySubmitSchema), async (c) => {
  const userId = await getUserId(c); // 認証：投稿者＝ログイン中ユーザー
  const body = c.req.valid("json"); // { theme, text, promptId? }

  // 外部キー制約のため、ユーザーのProfile行を用意（無ければ作る）
  await prisma.profile.upsert({
    where: { id: userId },
    update: {},
    create: { id: userId },
  });

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

const port = Number(process.env.PORT ?? 3001);
serve({ fetch: app.fetch, port });
console.log(`API listening on http://localhost:${port}`);

export default app;
