// Server Component から API を呼ぶときのベースURL。
//
// ブラウザからの fetch（NEXT_PUBLIC_API_URL）とは別物。Server Component は
// Webコンテナの中で動くので、コンテナ網のサービス名 api:3001 へ向ける必要がある。
//
// - ローカルdev: API_URL 未設定 → NEXT_PUBLIC_API_URL（http://localhost:3001）にフォールバック
// - Docker:      API_URL=http://api:3001 を compose から注入
export const SERVER_API_BASE =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
