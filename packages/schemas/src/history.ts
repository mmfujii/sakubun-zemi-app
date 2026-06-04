import { z } from "zod";

export const HistoryItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  createdAt: z.string(), // ISO8601
  score: z.number(),
  category: z.string().nullable(),
});

export const HistoryResponseSchema = z.object({
  totalCount: z.number(),
  avgScore: z.number().nullable(),
  items: z.array(HistoryItemSchema),
});

export type HistoryItem = z.infer<typeof HistoryItemSchema>;
export type HistoryResponse = z.infer<typeof HistoryResponseSchema>;
