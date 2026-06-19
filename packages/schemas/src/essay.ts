import { z } from "zod";

export const EssaySubmitSchema = z.object({
  theme: z.string().min(1, "テーマは必須"),
  text: z.string().min(50, "50文字以上").max(800, "800文字以内"),
  // お題から書いた場合のお題ID（自由作文ならundefined）
  promptId: z.string().optional(),
  // 目標字数（任意）。指定があれば添削が字数の過不足も評価する
  targetLengthMin: z.number().int().min(20).max(800).optional(),
  targetLengthMax: z.number().int().min(20).max(800).optional(),
});

export type EssaySubmit = z.infer<typeof EssaySubmitSchema>;

export const EssayFeedbackSchema = z.object({
  overallScore: z.number().min(0).max(100),
  comments: z.array(z.string()),
});

export type EssayFeedback = z.infer<typeof EssayFeedbackSchema>;
