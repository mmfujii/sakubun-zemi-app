import { PrismaClient } from "@prisma/client";

// AWS(ECS)では DATABASE_URL を直接持たず、RDSのdbシークレット由来の個別値から組み立てる。
// これにより destroy→再deploy で新RDS(新host/新password)になっても常に正しい接続先になる。
// ローカルは DATABASE_URL がそのまま入っているのでこの分岐はスキップ。
if (!process.env.DATABASE_URL && process.env.DB_HOST) {
  const user = process.env.DB_USER ?? "";
  const password = encodeURIComponent(process.env.DB_PASSWORD ?? "");
  const host = process.env.DB_HOST;
  const port = process.env.DB_PORT ?? "5432";
  const name = process.env.DB_NAME ?? "";
  process.env.DATABASE_URL = `postgresql://${user}:${password}@${host}:${port}/${name}`;
}

// グローバルシングルトン — 開発時のホットリロードで複数インスタンスが生成されるのを防ぐ
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // 本番(production)だけ静かに、それ以外（ローカル開発）はSQLクエリも出す。
    // 素のNodeではNODE_ENVが未設定なので「!== production」で判定するのがコツ。
    log:
      process.env.NODE_ENV === "production"
        ? ["error"]
        : ["query", "error", "warn"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
