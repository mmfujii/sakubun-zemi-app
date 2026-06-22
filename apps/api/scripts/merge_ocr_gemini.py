# 2つのOCR(Vision + Document AI)を相互補完の“二重錨”にして、画像と一緒にGeminiへ。
# VisionとDocAIは壊れる箇所が違う → 片方の欠けをもう片方が埋め、Geminiが画像で正解を選ぶ。
# 捏造はさせない（書かれていない事は足さない／判読不能は□）。
#
# 準備: pip3 install --break-system-packages google-genai pillow requests
# 実行:
#   VISION_API_KEY=... GEMINI_API_KEY=... \
#   DOCAI_TOKEN=$(gcloud auth print-access-token) \
#   DOCAI_PROJECT=sakubun-zemi DOCAI_LOCATION=us DOCAI_PROCESSOR_ID=... \
#   python3 scripts/merge_ocr_gemini.py ~/Documents/Claude/Projects/sakubunn/IMG_7140.jpg

import os, sys, base64, difflib, requests
from google import genai
from PIL import Image

EVAL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "ocr-eval")

need = ["VISION_API_KEY", "GEMINI_API_KEY", "DOCAI_TOKEN", "DOCAI_PROJECT", "DOCAI_PROCESSOR_ID"]
for k in need:
    if not os.environ.get(k):
        print(f"{k} を指定してください"); sys.exit(1)
loc = os.environ.get("DOCAI_LOCATION", "us")
model = os.environ.get("GEMINI_MODEL", "gemini-2.5-pro")

img_path = sys.argv[1] if len(sys.argv) > 1 else None
if not img_path or not os.path.exists(img_path):
    print("画像パスを指定してください"); sys.exit(1)

raw = open(img_path, "rb").read()
b64 = base64.b64encode(raw).decode()

# A: Cloud Vision
va = requests.post(
    f"https://vision.googleapis.com/v1/images:annotate?key={os.environ['VISION_API_KEY']}",
    json={"requests": [{"image": {"content": b64}, "features": [{"type": "DOCUMENT_TEXT_DETECTION"}], "imageContext": {"languageHints": ["ja"]}}]},
    timeout=60,
)
va.raise_for_status()
vision_text = va.json().get("responses", [{}])[0].get("fullTextAnnotation", {}).get("text", "").strip()

# B: Document AI
proj = os.environ["DOCAI_PROJECT"]; pid = os.environ["DOCAI_PROCESSOR_ID"]
db = requests.post(
    f"https://{loc}-documentai.googleapis.com/v1/projects/{proj}/locations/{loc}/processors/{pid}:process",
    headers={"Authorization": f"Bearer {os.environ['DOCAI_TOKEN']}", "Content-Type": "application/json"},
    json={"rawDocument": {"content": b64, "mimeType": "image/jpeg"}},
    timeout=60,
)
db.raise_for_status()
docai_text = db.json().get("document", {}).get("text", "").strip()

# 指示文は ocr-eval/prompt.txt から読む（プロンプト実験はこのファイルを編集する）。
prompt_path = os.path.join(EVAL_DIR, "prompt.txt")
instruction = open(prompt_path, encoding="utf-8").read().strip()
prompt = (
    f"{instruction}\n\n"
    f"OCR下書きA (Cloud Vision):\n---\n{vision_text}\n---\n\n"
    f"OCR下書きB (Document AI):\n---\n{docai_text}\n---"
)

client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
resp = client.models.generate_content(model=model, contents=[Image.open(img_path), prompt], config={"temperature": 0})

final = (resp.text or "(なし)").strip()
print(f"画像: {img_path} / モデル: {model}\n")
print("==== A: Vision ====\n" + vision_text)
print("\n==== B: Document AI ====\n" + docai_text)
print("\n==== 最終: 二重錨 + Gemini ====\n" + final)

# 正解との自動スコア比較（ground_truth.txt があれば）。空白・改行は無視して文字一致率。
gt_path = os.path.join(EVAL_DIR, "ground_truth.txt")
if os.path.exists(gt_path):
    gt = open(gt_path, encoding="utf-8").read()
    norm = lambda s: "".join(s.split())
    ratio = difflib.SequenceMatcher(None, norm(gt), norm(final)).ratio()
    print("\n==== スコア（正解比） ====")
    print(f"文字一致率: {ratio*100:.1f}%   (正解 {len(norm(gt))}字 / 出力 {len(norm(final))}字)")
    print("※ baseline(凍結)は約90%。これを下回ったら prompt.txt を prompt_baseline.txt に戻す")
