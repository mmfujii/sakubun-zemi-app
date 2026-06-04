import { serve } from "@hono/node-server";
import { zValidator } from "@hono/zod-validator";
import { EssaySubmitSchema } from "@sakubun-zemi/schemas";
import { Hono } from "hono";
import { cors } from "hono/cors";

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
