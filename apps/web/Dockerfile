# syntax=docker/dockerfile:1
# さくぶんゼミ Web（Next.js）コンテナ。
# ビルドコンテキストはリポジトリのルート（pnpmワークスペース全体が必要なため）。
#
# フェーズA方針: まず `next start` で確実に動かす（dev の start と同じ）。
# standalone 化による軽量イメージは AWS 直前のフェーズC で行う。

FROM node:24-slim AS base
RUN corepack enable
WORKDIR /repo

COPY . .
RUN pnpm install --frozen-lockfile --filter @sakubun-zemi/web...

# NEXT_PUBLIC_* は「ビルド時にクライアントJSへ焼き込まれる」公開値。
# そのため build より前に ENV として渡しておく必要がある（compose の build args 経由）。
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_API_MOCKING
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY \
    NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_API_MOCKING=$NEXT_PUBLIC_API_MOCKING

RUN pnpm --filter @sakubun-zemi/web build

ENV NODE_ENV=production
WORKDIR /repo/apps/web
EXPOSE 3000

# next start は PORT 環境変数を尊重し、0.0.0.0 で待ち受ける（compose から公開）
CMD ["pnpm", "exec", "next", "start"]
