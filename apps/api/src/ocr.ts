import { GoogleGenAI } from "@google/genai";
import { GoogleAuth } from "google-auth-library";

// ── OCRパイプライン（検証済み「二重錨」: Cloud Vision + Document AI → Gemini校正） ──
// 長い検証の結論（正解比 約90%、捏造なし）をそのままアプリに載せたもの。
//   ① Cloud Vision と ② Document AI で、それぞれ忠実に文字を読む（壊れる箇所が違い相互補完）。
//   ③ Gemini(pro) が両方の下書きと画像を見て、捏造せず誤読だけ直す（厳格プロンプト）。
//   - DocAIが未設定/失敗なら自動でVision単体にフォールバック（アプリは止めない）。
//   - 崩壊(同語ループ)を検知して壊れた出力はユーザーに見せない。
//   - 《 》マークやトリミングは、この基準状態の上に後から足す増分。

const VISION_API_KEY = process.env.CLOUD_VISION_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_OCR_MODEL ?? "gemini-2.5-pro";

// Document AI 設定（揃っていれば二重錨、無ければVision単体）
const DOCAI_PROJECT = process.env.DOCAI_PROJECT;
const DOCAI_LOCATION = process.env.DOCAI_LOCATION ?? "us";
const DOCAI_PROCESSOR_ID = process.env.DOCAI_PROCESSOR_ID;
// 本番(Vercel)はサービスアカウントJSONをenvで渡す。ローカルは ADC(gcloud auth application-default login)。
const GCP_SA_JSON = process.env.GCP_SERVICE_ACCOUNT_JSON;

type Media = "image/jpeg" | "image/png" | "image/gif" | "image/webp";
const ALLOWED: Media[] = ["image/jpeg", "image/png", "image/gif", "image/webp"];

function parseDataUrl(dataUrl: string): { media: Media; data: string } {
  const m = dataUrl.match(/^data:([^;]+);base64,(.*)$/);
  const mediaRaw = m?.[1];
  const data = m ? m[2] : dataUrl;
  const media: Media = ALLOWED.includes(mediaRaw as Media) ? (mediaRaw as Media) : "image/jpeg";
  return { media, data };
}

// ── ① Cloud Vision で忠実OCR ──
async function visionOcr(base64: string): Promise<string> {
  if (!VISION_API_KEY) throw new Error("CLOUD_VISION_API_KEY 未設定");
  const res = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${VISION_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [
          {
            image: { content: base64 },
            features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
            imageContext: { languageHints: ["ja"] },
          },
        ],
      }),
    },
  );
  if (!res.ok) throw new Error(`VISION_API_ERROR ${res.status}`);
  const json = (await res.json()) as {
    responses?: { fullTextAnnotation?: { text?: string }; error?: { message?: string } }[];
  };
  const r = json.responses?.[0];
  if (r?.error) throw new Error(`VISION_API_ERROR ${r.error.message ?? ""}`);
  return (r?.fullTextAnnotation?.text ?? "").trim();
}

// ── ② Document AI で忠実OCR（未設定/失敗なら null＝Vision単体に落ちる） ──
let docaiAuth: GoogleAuth | null = null;
function getDocaiAuth(): GoogleAuth {
  if (!docaiAuth) {
    docaiAuth = new GoogleAuth({
      scopes: "https://www.googleapis.com/auth/cloud-platform",
      ...(GCP_SA_JSON ? { credentials: JSON.parse(GCP_SA_JSON) } : {}),
    });
  }
  return docaiAuth;
}

async function docaiOcr(base64: string, media: Media): Promise<string | null> {
  if (!DOCAI_PROJECT || !DOCAI_PROCESSOR_ID) return null; // 未設定 → 単一錨
  try {
    const token = await (await getDocaiAuth().getClient()).getAccessToken();
    const url = `https://${DOCAI_LOCATION}-documentai.googleapis.com/v1/projects/${DOCAI_PROJECT}/locations/${DOCAI_LOCATION}/processors/${DOCAI_PROCESSOR_ID}:process`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ rawDocument: { content: base64, mimeType: media } }),
    });
    if (!res.ok) {
      console.warn("DocAI失敗(Vision単体で続行):", res.status, await res.text().catch(() => ""));
      return null;
    }
    const json = (await res.json()) as { document?: { text?: string } };
    return (json.document?.text ?? "").trim() || null;
  } catch (e) {
    console.warn("DocAI例外(Vision単体で続行):", e);
    return null;
  }
}

// ── ③ Gemini校正（検証済みの厳格プロンプト。捏造禁止・原文保持） ──
const MERGE_INSTRUCTION = `あなたは手書き作文OCRの統合担当です。OCRの下書きと元画像を渡します。
出力は『子どもが実際に書いた作文の本文』です。1文字も創作・修正・整形してはいけません。

最重要ルール（厳守）:
1. 下書きにある文字・語は、そのまま使う（複数の下書きが一致する箇所は絶対に変えない）。
2. 下書きが食い違う／壊れている箇所だけ、元画像を見て、画像に実際に書かれている文字を採用する。
3. 言い換え・語尾の調整・助詞の補完/修正・文法の修正・『自然な日本語』への整形を一切しない。
   子どもの誤字・おかしな助詞・不自然な接続・文法ミスも、書かれているまま残す（例:「上がるなくなる」を「上がらなくなる」に直さない）。
4. 迷ったら整えず、下書きの文字をそのまま優先する。創作・推測で文を作らない。
5. 升目番号・字数マーカー・「※」・問題番号などの非本文だけ除く。
6. どの下書きにも無く、画像でも判読できない箇所だけ □ にする。
7. 出力は作文本文のみ。前置き・説明・要約は書かない。`;

let genaiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY 未設定");
  if (!genaiClient) genaiClient = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  return genaiClient;
}

async function geminiMerge(
  media: Media,
  base64: string,
  visionText: string,
  docaiText: string | null,
): Promise<string> {
  const ai = getGenAI();
  const isFlash = GEMINI_MODEL.includes("flash");
  const drafts = docaiText
    ? `OCR下書きA (Cloud Vision):\n---\n${visionText}\n---\n\nOCR下書きB (Document AI):\n---\n${docaiText}\n---`
    : `OCR下書き (Cloud Vision):\n---\n${visionText}\n---`;
  const res = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { mimeType: media, data: base64 } },
          { text: `${MERGE_INSTRUCTION}\n\n${drafts}` },
        ],
      },
    ],
    config: {
      temperature: 0,
      // proは検証時と同じ“動的思考”に戻す（思考を絞ると言い換えが増えるため）。
      // 出力枠を広く取り、思考＋本文が詰まって空にならないようにする。
      maxOutputTokens: isFlash ? 4096 : 16000,
      ...(isFlash ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
    },
  });
  const text = (res.text ?? "").trim();
  if (!text) {
    const reason = res.candidates?.[0]?.finishReason ?? "unknown";
    throw new Error(`GEMINI_EMPTY(${reason})`);
  }
  return text;
}

// ── 崩壊（同語ループ）検知：壊れた出力をユーザーに見せない安全網 ──
export function looksDegenerate(text: string): boolean {
  const t = text.replace(/\s+/g, "");
  if (t.length < 200) return false;
  const n = 10;
  const grams = new Set<string>();
  let total = 0;
  for (let i = 0; i + n <= t.length; i++) {
    grams.add(t.slice(i, i + n));
    total++;
  }
  return total > 0 && grams.size / total < 0.35;
}

// ── 本体：画像(data URL)配列 → 忠実テキスト ──
export async function ocrImages(images: string[]): Promise<string> {
  const pages: string[] = [];
  for (const dataUrl of images) {
    const { media, data } = parseDataUrl(dataUrl);
    // VisionとDocAIは並行で読む
    const [visionText, docaiText] = await Promise.all([visionOcr(data), docaiOcr(data, media)]);
    if (!visionText && !docaiText) throw new Error("VISION_NO_TEXT");
    const corrected = await geminiMerge(media, data, visionText, docaiText);
    if (looksDegenerate(corrected)) {
      throw new Error("文字をうまく読み取れませんでした。撮り直すか、キーボード入力でお試しください。");
    }
    pages.push(corrected);
  }
  return pages.join("\n");
}
