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

app.post("/essays", zValidator("json", EssaySubmitSchema), (c) => {
  const body = c.req.valid("json");
  return c.json({
    received: body,
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
