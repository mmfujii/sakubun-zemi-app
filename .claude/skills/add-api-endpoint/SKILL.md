---
name: add-api-endpoint
description: さくぶんゼミV2にAPIエンドポイントを追加・変更するときの手順。Zodスキーマ → Honoルート → userIdでの絞り込み → web側の取得関数 → MSWモックまでを一貫して行う。新しいAPI、レスポンス項目の追加、既存ルートの変更のときに使う。
---

# API エンドポイントの追加・変更

新しいエンドポイントは、必ず次の順で作る。途中を飛ばさない。

## 1. スキーマ（packages/schemas/src/）

- 機能ごとのファイルに置く（例：`profile.ts`）。無ければ新規作成し、`index.ts` に `export * from "./xxx"` を追加
- リクエスト：`XxxRequestSchema`（または `XxxUpdateSchema` など用途名）
- レスポンス：`XxxResponseSchema`
- それぞれ `export type Xxx = z.infer<typeof XxxSchema>` を付ける
- エラーメッセージは子ども・保護者向けの日本語（例：`"20文字以内"`）

## 2. ルート（apps/api/src/app.ts）

```ts
app.put("/xxx", zValidator("json", XxxUpdateSchema), async (c) => {
  const userId = await getUserId(c);          // 最初に必ず取る。未認証なら401が投げられる
  const body = c.req.valid("json");
  const row = await prisma.xxx.findFirst({
    where: { id: c.req.param("id"), userId },  // 他人のデータが取れないよう userId を必ず入れる
  });
  if (!row) return c.json({ error: "not found" }, 404);
  // ...
  return c.json({ /* XxxResponseSchema の形に合わせて必要な項目だけ返す */ });
});
```

チェック：

- [ ] `getUserId(c)` を最初に呼んでいる（公開してよいデータ以外）
- [ ] Prisma の `where` に `userId`（Profile は `id: userId`）が入っている
- [ ] `findUnique({ where: { id } })` 単独で他人の行を返していない
- [ ] Prisma の行をそのまま返さず、レスポンススキーマの項目だけ返している
- [ ] 複数テーブルを書き換えるなら `prisma.$transaction` を使う

## 3. web 側の取得関数（apps/web/src/lib/api/xxx.ts）

Server Component から呼ぶ場合は既存の `quota.ts` と同じ形：

```ts
import { type Xxx, XxxResponseSchema } from "@sakubun-zemi/schemas";
import { serverAuthHeader } from "./auth-header";
import { SERVER_API_BASE } from "./server-base";

export async function getXxx(): Promise<Xxx> {
  const res = await fetch(`${SERVER_API_BASE}/xxx`, {
    headers: await serverAuthHeader(),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Failed to fetch xxx: ${res.status}`);
  return XxxResponseSchema.parse(await res.json());
}
```

Client Component から使う場合は `useQuery` / `useMutation`（TanStack Query）で包み、`isLoading` / `isError` の表示を必ず用意する。

## 4. MSW モック（apps/web/src/mocks/handlers.ts）

- 同じパスのハンドラを追加し、レスポンスは `XxxResponseSchema` の型で書く
- API 未完成でも画面を作れる状態にする

## 5. 確認

```bash
pnpm lint
pnpm typecheck
```

報告には、追加したパスとメソッド、認可（userId での絞り込み）の有無を書く。
