# さくぶんゼミ V2 — 開発ガイド（Claude Code 向け）

都立中受検向けの作文添削サービス。手書き作文の写真を OCR し、Claude で添削する。
このファイルは常に読み込まれる。作業ごとの手順は `.claude/skills/` にある。

## 構成

pnpm 9 workspace + Turborepo / Node 24（Volta）/ Biome 2（lint・format）

| パス | 役割 | 主な技術 |
|---|---|---|
| `apps/web` | 画面 | Next.js 16 App Router（`src/`）、React 19、TanStack Query 5、react-hook-form + Zod、@supabase/ssr、MSW |
| `apps/api` | API | Hono 4、@hono/zod-validator、Prisma 6（PostgreSQL）、Anthropic SDK、@google/genai、Stripe |
| `packages/schemas` | 入出力の型 | Zod。web と api の両方が import する唯一の契約 |
| `infra` | AWS | CDK（DNS / GitHub OIDC / 本体の3スタック） |

- API は2通りで動く。Vercel では `apps/web/src/app/api/[[...route]]/route.ts` から `hono/vercel` の `handle(app)` で同居。AWS / ローカルでは `apps/api/src/index.ts` の `serve()` で単独起動。どちらも `apps/api/src/app.ts` の同じ `app` を使う
- 認証：ブラウザで Supabase Auth → cookie → web のサーバー側で `lib/api/auth-header.ts` が Bearer を付ける → api の `auth.ts` の `getUserId(c)` が Supabase `/auth/v1/user` で検証

## コマンド（リポジトリ直下）

```bash
pnpm dev          # web + api
pnpm lint         # biome check .
pnpm check        # biome check --write .
pnpm typecheck    # turbo run typecheck
docker compose up -d db                          # ローカルDB（localhost:5433）
pnpm --filter @sakubun-zemi/api db:migrate       # prisma migrate dev
pnpm --filter @sakubun-zemi/api db:seed
```

## 守ること

1. **ユーザーのデータは必ず userId で絞る。** api のハンドラでは最初に `const userId = await getUserId(c)` を取り、Prisma の `where` に `userId`（Profile は `id: userId`）を入れる。`findUnique({ where: { id } })` だけで他人のデータが取れる形にしない。DB に RLS は無く、Prisma は RLS を通らないので、ここが唯一の防御線
2. **入出力の型は `packages/schemas` に置く。** api は `zValidator("json", XxxSchema)`、web は `XxxSchema.parse(await res.json())`。web / api の中で同じ型を別に定義しない
3. **NEXT_PUBLIC_* は静的に参照する。** `process.env.NEXT_PUBLIC_SUPABASE_URL` のように直接書く（ビルド時に埋め込まれるため、動的アクセスは undefined になる）。秘密情報を NEXT_PUBLIC_ に置かない
4. **`.env` は読まない・書かない。** 必要な変数名は `.env.example` と `turbo.json` の `globalEnv` を見る。新しい環境変数を足したら両方に追記する
5. **AI 生成（添削・OCR）の品質を、バリデーションを緩めて通さない。** 出力が期待を満たさないときはプロンプトか後処理を直す。OCR の精度比較は `apps/api/scripts/ocr-eval/` の正解データで行う
6. 変更後は `pnpm lint` と `pnpm typecheck` を通してから完了と報告する。報告には変更ファイルと未解決の点を書く

## 現状の弱いところ（直すときは相談してから）

- 自動テストが無い（MSW のモックはあるが Vitest 等は未導入）
- 退会（`POST /account/delete`）は `deleteMany` を3回順に実行しており、トランザクションでない
- Prisma スキーマに `@@index` が無い

## 止めて確認すること

- DB スキーマの破壊的変更（列の削除・型変更・既存データの移行が要るもの）
- 認証・課金（Stripe）まわりの挙動変更
- `infra/` の変更と `cdk deploy` / `cdk destroy`
- 依存パッケージのメジャーバージョン更新
