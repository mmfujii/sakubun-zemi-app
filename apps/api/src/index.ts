import { serve } from "@hono/node-server";
import { zValidator } from "@hono/zod-validator";
import { EssaySubmitSchema } from "@sakubun-zemi/schemas";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { prisma } from "./db";

const app = new Hono();

app.use(
  "/*",
  cors({
    origin: "http://localhost:3000",
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type"],
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
  // ユーザーの作文を新しい順で取得。feedback(点数)と prompt(お題)も一緒に取る（include = JOIN）
  const submissions = await prisma.submission.findMany({
    where: { userId: DEV_USER_ID },
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
  const id = c.req.param("id"); // URLの :id を取得

  const sub = await prisma.submission.findUnique({
    where: { id },
    include: { feedback: true, prompt: true }, // 関連も一緒に
  });

  // 見つからない or 添削がまだ無い → 404
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

// TODO: 認証(JWT)導入後は、ログイン中ユーザーのidに置き換える
const DEV_USER_ID = "dev-user-001";

app.post("/essays", zValidator("json", EssaySubmitSchema), async (c) => {
  const body = c.req.valid("json"); // { theme, text }

  // 作文をDBに1件保存（INSERT）
  const submission = await prisma.submission.create({
    data: {
      userId: DEV_USER_ID,
      theme: body.theme,
      rawText: body.text,
      // promptId は今回なし（自由作文扱い）
      // status は schema の @default("completed") が自動で入る
    },
  });

  // 添削結果はまだスタブ（b2で本物のClaudeに差し替え）
  return c.json({
    submissionId: submission.id,
    feedback: {
      overallScore: 80,
      comments: ["（仮レスポンス）添削処理は未実装"],
    },
  });
});

const port = Number(process.env.PORT ?? 3001);
serve({ fetch: app.fetch, port });
console.log(`API listening on http://localhost:${port}`);

export default app;
