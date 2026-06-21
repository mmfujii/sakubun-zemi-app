// Vercel用: Hono app を Next.js のキャッチオール Route Handler にマウントする。
// これにより web + API が1つのVercelデプロイ、APIは /api/* の同一オリジンになる。
// （ローカル/AWSは apps/api の Node サーバー(index.ts)を使う。このルートはVercel用）
import app from "@sakubun-zemi/api";
import { handle } from "hono/vercel";

// Prisma / Stripe / Anthropic SDK は Node ランタイムが必要（Edge不可）
export const runtime = "nodejs";

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);
export const OPTIONS = handle(app);
