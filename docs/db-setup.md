# ローカルDB セットアップ手順

Prisma + PostgreSQL (Docker) のローカル開発環境を立ち上げる手順です。

## 前提

- Docker Desktop がインストール済みで起動していること
- `apps/api/.env` に `DATABASE_URL` が設定されていること（`.env.example` をコピーすれば OK）

## 手順

### 1. DBコンテナを起動

```bash
# リポジトリ直下で実行
docker compose up -d
```

postgres:16-alpine が `localhost:5433` で起動します（5432 はローカル既存 DB との衝突を避けるため 5433 を使用）。

### 2. 初回マイグレーション

```bash
cd apps/api
corepack pnpm db:migrate
# プロンプトで migration 名を求められたら: init
```

`prisma/migrations/` にマイグレーションファイルが生成され、DB にテーブルが作成されます。

### 3. お題データを投入

```bash
corepack pnpm db:seed
```

`prompts` テーブルに 6 件のお題が upsert されます（冪等なので何度実行しても OK）。

### 4. Prisma Studio で確認

```bash
corepack pnpm db:studio
# ブラウザで http://localhost:5555 が開く
```

### 5. コンテナを止める

```bash
docker compose down
# データを消す場合:
docker compose down -v
```

## よく使うコマンド

| コマンド | 説明 |
|---|---|
| `pnpm db:generate` | Prisma クライアントを再生成（schema 変更後） |
| `pnpm db:migrate` | マイグレーションを作成・適用 |
| `pnpm db:seed` | シードデータを投入 |
| `pnpm db:studio` | GUI でデータを確認 |

## 注意

- `@prisma/client` の型は `pnpm db:generate`（または初回 `db:migrate`）を実行するまで生成されません。  
  `src/db.ts` や `prisma/seed.ts` で型エラーが出る場合はまず `pnpm db:generate` を実行してください。
- `.env` は `.gitignore` で除外済みです。機密情報をコミットしないよう注意してください。
