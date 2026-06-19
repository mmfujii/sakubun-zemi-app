import { z } from "zod";

// お子さま情報（1ユーザー1件。Profileに統合）。各項目は未設定可（null）。
export const ProfileUpdateSchema = z.object({
  childName: z.string().max(20, "20文字以内").nullable(),
  grade: z.number().int().min(1).max(9).nullable(), // 小学1〜中学3を許容
  targetSchool: z.string().max(50, "50文字以内").nullable(),
});

export type ProfileUpdate = z.infer<typeof ProfileUpdateSchema>;

// GET /profile のレスポンス
export const ProfileResponseSchema = z.object({
  displayName: z.string().nullable(),
  childName: z.string().nullable(),
  grade: z.number().nullable(),
  targetSchool: z.string().nullable(),
});

export type ProfileResponse = z.infer<typeof ProfileResponseSchema>;
