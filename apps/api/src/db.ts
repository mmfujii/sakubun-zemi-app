import { PrismaClient } from "@prisma/client";

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
