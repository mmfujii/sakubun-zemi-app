import { z } from "zod";

// GET /quota のレスポンス。enabled=false は課金無効環境（ローカル/AWSデモ）。
export const QuotaSchema = z.object({
  canSubmit: z.boolean(),
  plan: z.enum(["free", "light"]),
  used: z.number(),
  limit: z.number(),
  remaining: z.number(),
  ticketBalance: z.number(),
  willUseTicket: z.boolean(),
  cancelAtPeriodEnd: z.boolean(),
  currentPeriodEnd: z.string().nullable(),
  enabled: z.boolean(),
});

export type Quota = z.infer<typeof QuotaSchema>;
