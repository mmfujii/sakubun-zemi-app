// OCRプロンプト比較スクリプト（旧 vs 新）
// 使い方:
//   cd apps/api
//   node scripts/ocr-compare.mjs <画像パス>
//   例) node scripts/ocr-compare.mjs ~/Documents/Claude/Projects/sakubunn/IMG_7140.jpg
//
// ANTHROPIC_API_KEY は apps/api/.env から自動で読みます（無ければ環境変数）。
// ※ 本番アプリは画像をクライアント側で強調処理してから送ります。
//   このスクリプトは生画像で「プロンプトの違い」だけを比較する簡易版です。

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import Anthropic from "@anthropic-ai/sdk";

// --- .env から ANTHROPIC_API_KEY を雑にロード（dotenv不要） ---
const here = dirname(fileURLToPath(import.meta.url));
const envPath = join(here, "..", ".env");
if (!process.env.ANTHROPIC_API_KEY && existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*ANTHROPIC_API_KEY\s*=\s*(.*)\s*$/);
    if (m) process.env.ANTHROPIC_API_KEY = m[1].replace(/^["']|["']$/g, "");
  }
}
if (!process.env.ANTHROPIC_API_KEY) {
  console.error("ANTHROPIC_API_KEY が見つかりません（apps/api/.env か環境変数に設定してください）");
  process.exit(1);
}

const imgPath = process.argv[2];
if (!imgPath || !existsSync(imgPath)) {
  console.error("画像パスを指定してください。例: node scripts/ocr-compare.mjs ./sample.jpg");
  process.exit(1);
}

const OLD_PROMPT = `あなたは小中学生の手書き作文を文字起こしする専門家です。
画像に写っている作文を、書かれているとおりに正確にテキスト化してください。

ルール:
- 書かれている文字をそのまま起こす。誤字・脱字・表記ゆれも勝手に直さない（原文保持）。
- 改行・段落はできるだけ元の作文に合わせる。
- 原稿用紙のマス目は無視し、文章として連続したテキストにする。
- 判読できない文字は □ に置き換える。
- 作文本文以外（氏名欄・お題の印刷文字・ページ番号・注意書き等）は含めない。
- 出力は文字起こししたテキストのみ。説明・前置き・マークダウンは一切付けない。`;

const NEW_PROMPT = `あなたは小中学生の手書き作文を文字起こしする専門家です。
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

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const ext = imgPath.toLowerCase();
const media = ext.endsWith(".png") ? "image/png" : ext.endsWith(".webp") ? "image/webp" : "image/jpeg";
const data = readFileSync(imgPath).toString("base64");

async function run(system) {
  const res = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2000,
    temperature: 0,
    system,
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: media, data } },
          { type: "text", text: "この画像に書かれている作文を、ルールに従って文字起こししてください。" },
        ],
      },
    ],
  });
  return res.content.find((b) => b.type === "text")?.text?.trim() ?? "(テキストなし)";
}

console.log(`画像: ${imgPath}\n`);
const [oldOut, newOut] = await Promise.all([run(OLD_PROMPT), run(NEW_PROMPT)]);
console.log("==================== 旧プロンプト ====================\n");
console.log(oldOut);
console.log("\n==================== 新プロンプト ====================\n");
console.log(newOut);
console.log("\n=====================================================");
console.log(`文字数: 旧 ${oldOut.length} / 新 ${newOut.length}`);
