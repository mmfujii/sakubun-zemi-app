// ローカル/AWS(ECS) 用のNodeサーバー起動エントリ。
// app本体は ./app（@sakubun-zemi/api のエクスポート先）。Vercelはこのファイルを使わずRoute Handlerでappをmountする。
import { serve } from "@hono/node-server";
import app from "./app";

const port = Number(process.env.PORT ?? 3001);
serve({ fetch: app.fetch, port });
console.log(`API listening on http://localhost:${port}`);
