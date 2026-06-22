// Google Cloud Vision OCR 検証（DOCUMENT_TEXT_DETECTION）
// NotebookLMが使っているのと同系統の「専用ドキュメントOCR」を直接試す。
// 依存追加なし（fetchでREST）。
//
// 事前準備（Google Cloud Console、プロジェクトは AI Studio と同じ gen-lang-client-... でOK）:
//   1) 「Cloud Vision API」を有効化   https://console.cloud.google.com/apis/library/vision.googleapis.com
//   2) APIキーを用意（既存キーで403になる場合は、APIとサービス→認証情報→APIキー作成）
//
// 実行:
//   cd apps/api
//   VISION_API_KEY=xxxx node scripts/cloud-vision-test.mjs ~/Documents/Claude/Projects/sakubunn/IMG_7140.jpg

import { readFileSync, existsSync } from "node:fs";

const apiKey = process.env.VISION_API_KEY || process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("VISION_API_KEY を指定してください。");
  process.exit(1);
}

const imgPath = process.argv[2];
if (!imgPath || !existsSync(imgPath)) {
  console.error("画像パスを指定してください。");
  process.exit(1);
}

const content = readFileSync(imgPath).toString("base64");
const url = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;
const body = {
  requests: [
    {
      image: { content },
      features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
      imageContext: { languageHints: ["ja"] },
    },
  ],
};

const res = await fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

if (!res.ok) {
  console.error(`Cloud Vision エラー: ${res.status}`);
  console.error(await res.text());
  process.exit(1);
}

const json = await res.json();
const r = json?.responses?.[0];
if (r?.error) {
  console.error("APIエラー:", JSON.stringify(r.error, null, 2));
  process.exit(1);
}
const text = r?.fullTextAnnotation?.text ?? "(テキストなし)";

console.log(`画像: ${imgPath}\n`);
console.log("================ Cloud Vision 読み取り結果 ================\n");
console.log(text.trim());
console.log("\n==========================================================");
console.log(`文字数: ${text.trim().length}`);
