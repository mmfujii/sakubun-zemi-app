import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";

// Supabase の /auth/v1/user が返すユーザーJSON（必要な分だけ）
type SupabaseUser = { id: string; email?: string };

/**
 * リクエストの Authorization: Bearer <token> を検証し、ユーザー（id＋email）を返す。
 *
 * トークンの正当性チェックは Supabase に委ねる（/auth/v1/user を叩く）。
 * これは supabase-js の auth.getUser(token) が内部でやっているのと同じこと。
 * 無効/未指定なら 401 を投げる（Honoが自動でレスポンスにする）。
 */
export async function getUser(c: Context): Promise<SupabaseUser> {
  // env はリクエスト時に読む（モジュール読み込み時だとPrismaのdotenv展開前で undefined になる）
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    // 設定漏れはサーバー側の問題なので500
    throw new HTTPException(500, { message: "Supabase env not configured" });
  }

  const authHeader = c.req.header("Authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "");
  if (!token) {
    throw new HTTPException(401, { message: "Missing access token" });
  }

  // Supabase にトークンを検証してもらう
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: SUPABASE_ANON_KEY,
    },
  });

  if (!res.ok) {
    throw new HTTPException(401, { message: "Invalid access token" });
  }

  const user = (await res.json()) as SupabaseUser;
  if (!user?.id) {
    throw new HTTPException(401, { message: "Invalid access token" });
  }

  return user;
}

/** ユーザーIDだけ欲しい場合のショートカット。 */
export async function getUserId(c: Context): Promise<string> {
  return (await getUser(c)).id;
}
