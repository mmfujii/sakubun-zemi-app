// Document AI (Enterprise Document OCR) 検証
// NotebookLMが使っている可能性が高い上位OCR。Visionより読み順・断片化に強い。
// 認証はAPIキー不可 → gcloudのアクセストークン(Bearer)を使う。依存追加なし(fetch)。
//
// 事前準備:
//   1) Document AI API 有効化  https://console.cloud.google.com/apis/library/documentai.googleapis.com
//   2) プロセッサ作成: Document AI → プロセッサ → 「Document OCR」を作成 → リージョン(us推奨)
//      作成後の「プロセッサID」と「リージョン」を控える
//      https://console.cloud.google.com/ai/document-ai/processors
//   3) gcloud 用意（未インストールなら）: brew install --cask google-cloud-sdk
//      gcloud auth login ; gcloud config set project sakubun-zemi
//
// 実行:
//   DOCAI_TOKEN=$(gcloud auth print-access-token) \
//   DOCAI_PROJECT=sakubun-zemi \
//   DOCAI_LOCATION=us \
//   DOCAI_PROCESSOR_ID=xxxxxxxxxxxx \
//   node scripts/docai-test.mjs ~/Documents/Claude/Projects/sakubunn/IMG_7140.jpg

import { existsSync, readFileSync } from "node:fs";

const token = process.env.DOCAI_TOKEN;
const project = process.env.DOCAI_PROJECT;
const location = process.env.DOCAI_LOCATION || "us";
const processorId = process.env.DOCAI_PROCESSOR_ID;

for (const [k, v] of Object.entries({
  DOCAI_TOKEN: token,
  DOCAI_PROJECT: project,
  DOCAI_PROCESSOR_ID: processorId,
})) {
  if (!v) {
    console.error(`${k} を指定してください。`);
    process.exit(1);
  }
}

const imgPath = process.argv[2];
if (!imgPath || !existsSync(imgPath)) {
  console.error("画像パスを指定してください。");
  process.exit(1);
}

const ext = imgPath.toLowerCase();
const mime = ext.endsWith(".png")
  ? "image/png"
  : ext.endsWith(".webp")
    ? "image/webp"
    : "image/jpeg";
const content = readFileSync(imgPath).toString("base64");

const url = `https://${location}-documentai.googleapis.com/v1/projects/${project}/locations/${location}/processors/${processorId}:process`;

const res = await fetch(url, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ rawDocument: { content, mimeType: mime } }),
});

if (!res.ok) {
  console.error(`Document AI エラー: ${res.status}`);
  console.error(await res.text());
  process.exit(1);
}

const json = await res.json();
const text = json?.document?.text ?? "(テキストなし)";

console.log(`画像: ${imgPath}\nプロセッサ: ${location}/${processorId}\n`);
console.log("============ Document AI 読み取り結果 ============\n");
console.log(text.trim());
console.log("\n=================================================");
console.log(`文字数: ${text.trim().length}`);
