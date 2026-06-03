import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { EssaySubmitSchema } from "@sakubun-zemi/schemas";

const app = new Hono();

app.get("/", (c) => c.json({ ok: true, service: "sakubun-zemi-api" }));

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
