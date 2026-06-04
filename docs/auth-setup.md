# Supabase Auth セットアップ手順

## 1. Supabase プロジェクト作成

1. https://supabase.com にアクセスしてログイン
2. "New project" をクリック
3. プロジェクト名（例: `sakubun-zemi-v2`）、データベースパスワード、リージョン（`Northeast Asia (Tokyo)`）を設定して作成

## 2. 環境変数の設定

1. Supabase ダッシュボード → **Project Settings** → **API** を開く
2. 以下の値をコピーする:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. `apps/web/.env.example` をコピーして `apps/web/.env.local` を作成し値を記入:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

## 3. 開発中: メール確認をオフにする（任意）

確認メールなしですぐテストしたい場合:

1. Supabase ダッシュボード → **Authentication** → **Providers** → **Email**
2. **"Confirm email"** トグルをオフにする
3. これでサインアップ直後にセッションが発行され `/dashboard` にリダイレクトされる

> 本番リリース前には必ずオンに戻すこと。

## 4. ローカル起動確認

```bash
cd apps/web
pnpm dev
```

- `http://localhost:3000/signup` → 新規登録
- `http://localhost:3000/login` → ログイン
- `http://localhost:3000/dashboard` → 未ログインなら `/login` にリダイレクト

## 5. メール確認フロー（本番）

1. ユーザーがサインアップ → 確認メールが届く
2. メール内リンクをクリック → `/auth/callback?code=...` にリダイレクト
3. コードをセッションに交換して `/dashboard` へ転送

## スコープ外（後フェーズ）

- パスワードリセット
- OAuth (Google / LINE)
- child_profiles / subscriptions テーブルの自動作成（DB スキーマ整備後）
- Hono API の JWT 保護
