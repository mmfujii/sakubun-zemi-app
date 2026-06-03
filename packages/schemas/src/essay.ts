import { z } from "zod";

export const EssaySubmitSchema = z.object({
  theme: z.string().min(1, "テーマは必須"),
  text: z.string().min(100, "100文字以上").max(5000, "5000文字以内"),
});

export type EssaySubmit = z.infer<typeof EssaySubmitSchema>;

export const EssayFeedbackSchema = z.object({
  overallScore: z.number().min(0).max(100),
  comments: z.array(z.string()),
});

export type EssayFeedback = z.infer<typeof EssayFeedbackSchema>;
