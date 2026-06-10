// NEXT_PUBLIC_* はビルド時にクライアントJSへインライン化される公開値。
// Next.js のインライン化は `process.env.NEXT_PUBLIC_X` の「静的アクセス」が条件なので、
// ここで一度だけ静的に読み、各所はこの定数を import して使う（非null assertion を避ける）。
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
