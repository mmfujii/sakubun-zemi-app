import { createClient } from "@/lib/supabase/server";

/**
 * Server Component から API を呼ぶときの Authorization ヘッダを作る。
 * cookie のセッションから Supabase アクセストークンを読み、Bearer で渡す。
 * （API 側はこのトークンを検証してユーザーを特定する）
 */
export async function serverAuthHeader(): Promise<Record<string, string>> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
}
