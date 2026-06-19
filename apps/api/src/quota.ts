import { prisma } from "./db";

export type QuotaStatus = {
  canSubmit: boolean;
  plan: "free" | "light";
  used: number;
  limit: number;
  remaining: number;
  ticketBalance: number; // チケット残枚数（lightのみ有効）
  willUseTicket: boolean; // 今回の添削でチケットを消費するか
};

// 本番(Vercel)で課金を有効化。ローカル/AWSデモは QUOTA_ENABLED=false で上限無効。
export const QUOTA_ENABLED = process.env.QUOTA_ENABLED !== "false";

/**
 * 添削残り回数をチェック（V1 lib/quota.ts のPrisma移植）
 * - free: 完了済みsubmissionの生涯総数 vs freeLimit
 * - light: 課金期間内の完了数 vs monthlyLimit、超過時はチケットがあれば可
 */
export async function checkQuota(userId: string): Promise<QuotaStatus> {
  const sub = await prisma.subscription.findUnique({ where: { userId } });

  const countCompleted = (since?: Date) =>
    prisma.submission.count({
      where: {
        userId,
        status: "completed",
        ...(since ? { createdAt: { gte: since } } : {}),
      },
    });

  // サブスク無し or 無料プラン
  if (!sub || sub.plan === "free") {
    const limit = sub?.freeLimit ?? 1;
    const used = await countCompleted();
    return {
      canSubmit: used < limit,
      plan: "free",
      used,
      limit,
      remaining: Math.max(0, limit - used),
      ticketBalance: 0,
      willUseTicket: false,
    };
  }

  // ライトプラン: 課金期間の開始日を算出（current_period_end の1ヶ月前、無ければ当月1日）
  let periodStart: Date;
  if (sub.currentPeriodEnd) {
    const start = new Date(sub.currentPeriodEnd);
    start.setMonth(start.getMonth() - 1);
    periodStart = start;
  } else {
    const now = new Date();
    periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const used = await countCompleted(periodStart);
  const limit = sub.monthlyLimit;
  const monthlyRemaining = Math.max(0, limit - used);
  const ticketBalance = sub.ticketBalance ?? 0;

  return {
    canSubmit: monthlyRemaining > 0 || ticketBalance > 0,
    plan: "light",
    used,
    limit,
    remaining: monthlyRemaining,
    ticketBalance,
    willUseTicket: monthlyRemaining === 0 && ticketBalance > 0,
  };
}
