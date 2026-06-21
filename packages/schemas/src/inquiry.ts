import { z } from "zod";

export const InquiryCreateSchema = z.object({
  subject: z.string().min(1, "件名は必須です").max(100, "100文字以内"),
  message: z.string().min(1, "内容は必須です").max(2000, "2000文字以内"),
});

export type InquiryCreate = z.infer<typeof InquiryCreateSchema>;
