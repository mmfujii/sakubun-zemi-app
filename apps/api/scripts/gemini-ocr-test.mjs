// Gemini OCR 検証スクリプト（NotebookLM相当の読み取りを自分のコードで確認する）
// 依存追加なし（fetchでREST直叩き）。まずは無料のAI Studioキーで動作確認する用。
//
// 1) https://aistudio.google.com/apikey で無料APIキーを発行
// 2) cd apps/api
// 3) GEMINI_API_KEY=xxxx node scripts/gemini-ocr-test.mjs ~/Documents/Claude/Projects/sakubunn/IMG_7140.jpg
//
// モデル名は変わるので必要なら GEMINI_MODEL で上書き（既定: gemini-2.5-pro）。
// ※ これはAI Studio経路（検証用）。本番は Vertex AI 経由を推奨。

import { existsSync, readFileSync } from "node:fs";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("GEMINI_API_KEY を指定してください（AI Studioで無料発行）。");
  process.exit(1);
}
const model = process.env.GEMINI_MODEL || "gemini-2.5-pro";

const imgPath = process.argv[2];
if (!imgPath || !existsSync(imgPath)) {
  console.error("画像パスを指定してください。例: node scripts/gemini-ocr-test.mjs ./sample.jpg");
  process.exit(1);
}

const ext = imgPath.toLowerCase();
const mime = ext.endsWith(".png")
  ? "image/png"
  : ext.endsWith(".webp")
    ? "image/webp"
    : "image/jpeg";
const data = readFileSync(imgPath).toString("base64");

// ocr.ts と同じ方針の verbatim プロンプト
const PROMPT = `あなたは小中学生の手書き作文を文字起こしする専門家です。
画像の作文を「一字一句そのまま」テキスト化してください。

- 誤字・脱字・送り仮名・表記ゆれも直さない・補わない・言い換えない・要約しない。
- 促音「っ」・拗音「ゃゅょ」・句読点もそのまま。読めない字は □ に置き換える。
- 原稿用紙に縦書きの場合、各列を上から下へ・列は右から左の順で読む。横書きは左→右・上→下。
- マス目・罫線・破線は文字ではないので「一」「ー」等として読み取らない。
- 出力は本文のみ。説明・前置き・マークダウンは付けない。`;

const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
const body = {
  contents: [
    {
      role: "user",
      parts: [{ text: PROMPT }, { inline_data: { mime_type: mime, data } }],
    },
  ],
  generationConfig: { temperature: 0 },
};

const res = await fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

if (!res.ok) {
  console.error(`Gemini API エラー: ${res.status}`);
  console.error(await res.text());
  process.exit(1);
}

const json = await res.json();
const text = json?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ?? "(テキストなし)";

console.log(`モデル: ${model}\n画像: ${imgPath}\n`);
console.log("==================== Gemini 読み取り結果 ====================\n");
console.log(text.trim());
console.log("\n============================================================");
console.log(`文字数: ${text.trim().length}`);
