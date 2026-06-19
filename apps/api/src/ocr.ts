import Anthropic from "@anthropic-ai/sdk";

// ── Claude クライアント（APIキーは apps/api/.env の ANTHROPIC_API_KEY。feedback.ts と共通） ──
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── 文字起こし用システムプロンプト（原文保持・本文のみ） ──
const OCR_SYSTEM_PROMPT = `あなたは小中学生の手書き作文を文字起こしする専門家です。
画像に写っている作文を、書かれているとおりに正確にテキスト化してください。

ルール:
- 書かれている文字をそのまま起こす。誤字・脱字・表記ゆれも勝手に直さない（原文保持）。
- 改行・段落はできるだけ元の作文に合わせる。
- 原稿用紙のマス目は無視し、文章として連続したテキストにする。
- 判読できない文字は □ に置き換える。
- 作文本文以外（氏名欄・お題の印刷文字・ページ番号・注意書き等）は含めない。
- 出力は文字起こししたテキストのみ。説明・前置き・マークダウンは一切付けない。`;

// Anthropic が受け付ける画像MIME
type Media = "image/jpeg" | "image/png" | "image/gif" | "image/webp";
const ALLOWED: Media[] = ["image/jpeg", "image/png", "image/gif", "image/webp"];

// data URL ("data:image/png;base64,xxxx") を Anthropic の画像ブロックに変換。
// prefix が無い／未知の形式は jpeg とみなす。
function toImageBlock(dataUrl: string): Anthropic.ImageBlockParam {
  const m = dataUrl.match(/^data:([^;]+);base64,(.*)$/);
  const mediaRaw = m?.[1];
  const data = m ? m[2] : dataUrl;
  const media: Media = ALLOWED.includes(mediaRaw as Media) ? (mediaRaw as Media) : "image/jpeg";
  return { type: "image", source: { type: "base64", media_type: media, data } };
}

// ── 文字起こし本体：画像（data URL）配列を受け取り、テキストを返す ──
export async function ocrImages(images: string[]): Promise<string> {
  const content: Anthropic.ContentBlockParam[] = [
    ...images.map(toImageBlock),
    {
      type: "text",
      text: "この画像に書かれている作文を、ルールに従って文字起こししてください。",
    },
  ];

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2000,
    temperature: 0,
    system: OCR_SYSTEM_PROMPT,
    messages: [{ role: "user", content }],
  });

  // トークン上限で途中で切れていないか
  if (response.stop_reason === "max_tokens") {
    throw new Error("OCR応答がトークン上限で途中で切れました");
  }

  const textBlock = response.content.find((b) => b.type === "text");
  if (textBlock?.type !== "text") {
    throw new Error("Claude応答にテキストが含まれていません");
  }

  return textBlock.text.trim();
}
