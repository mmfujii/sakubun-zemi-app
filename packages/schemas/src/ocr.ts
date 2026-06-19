import { z } from "zod";

// OCR入力: クライアントで縮小した画像を data URL（"data:image/jpeg;base64,..."）で送る。
// 1〜4枚まで（子どもの作文は通常1〜2枚）。保存はせずサーバーで文字起こしのみ行う。
export const OcrRequestSchema = z.object({
  images: z
    .array(z.string().min(1))
    .min(1, "画像が必要です")
    .max(4, "画像は最大4枚です"),
});

export type OcrRequest = z.infer<typeof OcrRequestSchema>;

// OCR結果: 文字起こししたテキストのみ返す（編集して /essays に提出する想定）
export const OcrResponseSchema = z.object({
  text: z.string(),
});

export type OcrResponse = z.infer<typeof OcrResponseSchema>;
