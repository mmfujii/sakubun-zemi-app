---
name: prisma-migration
description: さくぶんゼミV2でPrismaスキーマ（apps/api/prisma/schema.prisma）を変更し、マイグレーションを作るときの手順。テーブル・列・インデックスの追加や変更、seedの更新のときに使う。
---

# Prisma マイグレーション

## 前提

- ローカルDBは Docker（`docker compose up -d db`、ホスト側ポート 5433）
- 本番 DB に対して `migrate dev` / `migrate reset` / `db push` を実行しない

## 手順

1. **破壊的かどうかを先に判定する**
   - 列の削除、型の変更、NOT NULL 化、ユニーク制約の追加は破壊的。既存データの移行方法をユーザーに確認してから進める
   - 列の追加（nullable かデフォルト付き）、テーブル追加、インデックス追加は非破壊
2. `apps/api/prisma/schema.prisma` を編集する
   - 外部キーの列には `@@index([userId])` のようにインデックスを付ける（Postgres は FK に自動でインデックスを張らない）
   - リレーションの `onDelete` を明示する
3. マイグレーションを作る（名前は必ず付ける。無名のマイグレーションを増やさない）
   ```bash
   pnpm --filter @sakubun-zemi/api exec prisma migrate dev --name <変更内容_snake_case>
   ```
4. 生成された `apps/api/prisma/migrations/<日時>_<名前>/migration.sql` を開いて読み、意図しない `DROP` が無いか確認する
5. 型の反映と確認
   ```bash
   pnpm --filter @sakubun-zemi/api db:generate
   pnpm typecheck
   ```
6. 必要なら `apps/api/prisma/seed.ts` を更新して `db:seed` で確認
7. レスポンスに新しい項目を出すなら `add-api-endpoint` スキルの手順で `packages/schemas` まで直す

## 報告に書くこと

- 追加・変更したモデルと列
- 破壊的変更の有無
- マイグレーション名
