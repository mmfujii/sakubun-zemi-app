# ハイブリッドOCR検証: Cloud Visionの忠実テキストを“錨”にして、Geminiに画像と一緒に渡し、
# 捏造させずに誤読だけ直させる。NotebookLM並みの綺麗さを、捏造なしで狙う最後の本命。
#
# 準備:
#   pip3 install --break-system-packages google-genai pillow requests
# 実行:
#   VISION_API_KEY=Visionキー GEMINI_API_KEY=Geminiキー \
#   python3 scripts/vision_gemini_anchor.py ~/Documents/Claude/Projects/sakubunn/IMG_7140.jpg

import os
import sys
import base64
import requests
from google import genai
from PIL import Image

vision_key = os.environ.get("VISION_API_KEY")
gemini_key = os.environ.get("GEMINI_API_KEY")
model = os.environ.get("GEMINI_MODEL", "gemini-2.5-pro")

if not vision_key or not gemini_key:
    print("VISION_API_KEY と GEMINI_API_KEY の両方を指定してください")
    sys.exit(1)

img_path = sys.argv[1] if len(sys.argv) > 1 else None
if not img_path or not os.path.exists(img_path):
    print("画像パスを指定してください")
    sys.exit(1)

# ① Cloud Vision で忠実OCR
with open(img_path, "rb") as f:
    content_b64 = base64.b64encode(f.read()).decode()

vres = requests.post(
    f"https://vision.googleapis.com/v1/images:annotate?key={vision_key}",
    json={
        "requests": [
            {
                "image": {"content": content_b64},
                "features": [{"type": "DOCUMENT_TEXT_DETECTION"}],
                "imageContext": {"languageHints": ["ja"]},
            }
        ]
    },
    timeout=60,
)
vres.raise_for_status()
vision_text = (
    vres.json().get("responses", [{}])[0].get("fullTextAnnotation", {}).get("text", "").strip()
)
if not vision_text:
    print("Visionがテキストを返しませんでした")
    sys.exit(1)

# ② Gemini に「画像 + Vision下書き」を渡し、捏造させず誤読だけ直させる
prompt = (
    "あなたは手書き作文の文字起こしの校正者です。OCRエンジン(Cloud Vision)が出した下書きと、元画像の両方を渡します。\n"
    "あなたの仕事は、画像を見ながらOCR下書きを修正し、画像に実際に書かれているとおりの作文本文にすることです。\n\n"
    "厳守:\n"
    "- OCR下書きを土台にする。画像で確認して、明らかな誤読・文字化け・分断だけを、画像に書かれている文字に直す。\n"
    "- 画像に書かれていない内容を足さない・言い換えない・要約しない。子どもの誤字や稚拙な表現はそのまま残す。\n"
    "- 原稿用紙の升目番号・字数マーカー・「※」・問題番号などの非本文は除く。\n"
    "- どうしても画像から判読できない箇所は、推測で埋めず □ にする。存在しない文を作らない。\n"
    "- 出力は作文本文のみ。前置きや説明は書かない。\n\n"
    "OCR下書き:\n---\n" + vision_text + "\n---"
)

client = genai.Client(api_key=gemini_key)
image = Image.open(img_path)
response = client.models.generate_content(
    model=model,
    contents=[image, prompt],
    config={"temperature": 0},
)

print(f"画像: {img_path} / モデル: {model}\n")
print("======== ① Cloud Vision 下書き ========\n")
print(vision_text)
print("\n======== ② Gemini で錨つき補正（最終）========\n")
print((response.text or "(なし)").strip())
print("\n=======================================")
print(f"文字数: 下書き {len(vision_text)} / 最終 {len((response.text or '').strip())}")
