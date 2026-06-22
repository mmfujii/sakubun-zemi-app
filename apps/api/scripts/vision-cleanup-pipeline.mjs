// 本番OCRパイプラインの試作: ① Cloud Vision でOCR → ② Claudeで本文だけに整形
// Visionが読み順・本文を正確に取り、Claude(テキスト処理)が升目番号・記号・OCRゴミを除く。
// 依存追加なし。VISION_API_KEY は環境変数、ANTHROPIC_API_KEY は .env から自動ロード。
//
//   cd apps/api
//   VISION_API_KEY=xxxx node scripts/vision-cleanup-pipeline.mjs ~/Documents/Claude/Projects/sakubunn/IMG_7140.jpg

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import Anthropic from "@anthropic-ai/sdk";

const here = dirname(fileURLToPath(import.meta.url));
const envPath = join(here, "..", ".env");
if (!process.env.ANTHROPIC_API_KEY && existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*ANTHROPIC_API_KEY\s*=\s*(.*)\s*$/);
    if (m) process.env.ANTHROPIC_API_KEY = m[1].replace(/^["']|["']$/g, "");
  }
}

const visionKey = process.env.VISION_API_KEY;
if (!visionKey) {
  console.error("VISION_API_KEY を指定してください。");
  process.exit(1);
}
if (!process.env.ANTHROPIC_API_KEY) {
  console.error("ANTHROPIC_API_KEY が見つかりません（apps/api/.env）。");
  process.exit(1);
}

const imgPath = process.argv[2];
if (!imgPath || !existsSync(imgPath)) {
  console.error("画像パスを指定してください。");
  process.exit(1);
}

// ① Cloud Vision OCR
const content = readFileSync(imgPath).toString("base64");
const vRes = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${visionKey}`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    requests: [
      {
        image: { content },
        features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
        imageContext: { languageHints: ["ja"] },
      },
    ],
  }),
});
if (!vRes.ok) {
  console.error(`Cloud Vision エラー: ${vRes.status}`);
  console.error(await vRes.text());
  process.exit(1);
}
const vJson = await vRes.json();
const rawText = vJson?.responses?.[0]?.fullTextAnnotation?.text?.trim() ?? "";
if (!rawText) {
  console.error("Visionがテキストを返しませんでした。");
  process.exit(1);
}

// ② Claude で本文だけに整形（テキスト処理）
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const CLEANUP_SYSTEM = `あなたは、画像OCRした小中学生の作文の生テキストを整える担当です。これは添削サービス用なので、子どもが実際に書いた文を1字も捏造してはいけません。

入力は原稿用紙の作文をOCRしたもので、読み順はおおむね正しいですが、升目番号・字数マーカー・ページ番号・「※」「問題3」などの非本文や、OCRのゴミ文字・分断が混ざっています。

厳守:
- 升目番号・字数マーカー（例: 45, 205, 400）・「※」・「[問題3]」等の非本文だけを除く。
- 分断された行（同じ文が途中で改行されただけ）はつなげてよい。
- OCRが明らかに1〜2文字壊しただけで、正しい語が一意に確定できる場合のみ直す（例: 「考ヶち」→「考え方」）。
- それ以外、文脈から推測して埋めるのは禁止。読めない・欠けている・自信がない箇所は、勝手に言葉を作らず 〔？〕 と書いて残す。
- 語彙・言い回し・助詞を「自然な日本語」に直さない。子どもの誤字・稚拙な表現もそのまま。要約・言い換え・付け足し禁止。
- 出力は整えた作文本文のみ（説明や前置きは付けない）。`;

const cRes = await anthropic.messages.create({
  model: "claude-sonnet-4-6",
  max_tokens: 2000,
  temperature: 0,
  system: CLEANUP_SYSTEM,
  messages: [{ role: "user", content: `次のOCR生テキストを整えてください:\n\n${rawText}` }],
});
const cleaned = cRes.content.find((b) => b.type === "text")?.text?.trim() ?? "(整形失敗)";

console.log(`画像: ${imgPath}\n`);
console.log("======== ① Cloud Vision 生OCR ========\n");
console.log(rawText);
console.log("\n======== ② Claude 整形後（本文のみ）========\n");
console.log(cleaned);
console.log("\n======================================");
console.log(`文字数: 生 ${rawText.length} / 整形後 ${cleaned.length}`);
