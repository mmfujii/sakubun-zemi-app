import Anthropic from "@anthropic-ai/sdk";

// ── Claude クライアント（APIキーは apps/api/.env の ANTHROPIC_API_KEY。feedback.ts と共通） ──
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── 文字起こし用システムプロンプト（原文保持・本文のみ） ──
const OCR_SYSTEM_PROMPT = `あなたは小中学生の手書き作文を文字起こしする専門家です。
画像に写っている作文を、書かれているとおりに「一字一句そのまま」テキスト化してください。

【最優先：書かれている通りに写すこと（直さない）】
- 書かれている文字をそのまま起こす。誤字・脱字・送り仮名・かな/漢字の選び方・表記ゆれも、絶対に直さない・補わない・言い換えない・要約しない。「良くしよう」としない。
- 促音「っ」・拗音「ゃゅょ」・句読点「、。」・かぎかっこも、書かれている通りに再現する。
- 判読できない文字は推測で埋めず □ に置き換える。存在しない文字を作らない。

【書字方向と読み順（重要）】
- この作文は原稿用紙に「縦書き」で書かれていることが多い。縦書きの場合は、各列（行）を上から下へ読み、列は右から左の順に進む。読み順を絶対に間違えないこと。
- 横書きの場合は、左から右・上から下に読む。
- 原稿用紙のマス目・罫線・破線（点線）は文字ではない。罫線を「一」「ー」「｜」などの文字として読み取らないこと。マス目は無視し、文章として連続したテキストにする。

【その他】
- 改行・段落はできるだけ元の作文に合わせる。
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

// ── 崩壊（ループ）検知 ──
// 汎用ビジョンLLMは手書き縦書きを読めないと同じ語句を延々繰り返す崩壊を起こす。
// その出力をユーザーに見せないよう、退化した繰り返しを検知して失敗扱いにする。
export function looksDegenerate(text: string): boolean {
  const t = text.replace(/\s+/g, "");
  if (t.length < 200) return false; // 短い出力は誤検知を避けて許容

  // 長さ10の部分文字列の「異なり率」。崩壊出力は同じ窓が大量に重複し率が極端に低い。
  const n = 10;
  const grams = new Set<string>();
  let total = 0;
  for (let i = 0; i + n <= t.length; i++) {
    grams.add(t.slice(i, i + n));
    total++;
  }
  const distinctRatio = total > 0 ? grams.size / total : 1;
  return distinctRatio < 0.35;
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

  const text = textBlock.text.trim();

  // 崩壊（同じ語句のループ）を検知したら、壊れた結果を返さず失敗にする。
  // フロントは「読み取りに失敗→撮り直し/キーボード入力」に誘導される。
  if (looksDegenerate(text)) {
    throw new Error("文字をうまく読み取れませんでした。撮り直すか、キーボード入力でお試しください。");
  }

  return text;
}
