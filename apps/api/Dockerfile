# syntax=docker/dockerfile:1
# さくぶんゼミ API（Hono）コンテナ。
# ビルドコンテキストはリポジトリのルート（pnpmワークスペース全体が必要なため）。
#
# フェーズA方針: 確実に動かすため dev と同じ tsx で実行する。
# （共有パッケージ @sakubun-zemi/schemas が TSソース配布のため node dist だと壊れる。
#   本番向けの多段ビルド最適化は AWS 直前のフェーズC で行う）

FROM node:24-slim AS base
# Prisma が必要とする openssl と、pnpm（corepack経由）を用意
RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && corepack enable
WORKDIR /repo

# ワークスペース一式をコピー（.dockerignore で node_modules や .env は除外済み）
COPY . .

# api とその依存（schemas）だけインストール
RUN pnpm install --frozen-lockfile --filter @sakubun-zemi/api...

# Prisma クライアントを生成（このlinuxイメージ向けのエンジンが作られる）
RUN pnpm --filter @sakubun-zemi/api exec prisma generate

ENV NODE_ENV=production
WORKDIR /repo/apps/api
EXPOSE 3001

# dev と同じ実行（watch なし）。DATABASE_URL 等は compose から注入
CMD ["pnpm", "exec", "tsx", "src/index.ts"]
