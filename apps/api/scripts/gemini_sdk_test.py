# Geminiアプリが提示した「そのままのコード」を検証する。
# 疑い（スクリプトが悪いだけ?）を消すため、google-genai SDK + PIL + 同じ簡単プロンプトで実行。
#
# 準備:
#   pip3 install --break-system-packages google-genai pillow
# 実行:
#   GEMINI_API_KEY=AIStudioのキー python3 scripts/gemini_sdk_test.py ~/Documents/Claude/Projects/sakubunn/IMG_7140_processed.jpg
#   （モデルを変える場合）GEMINI_MODEL=gemini-2.5-flash を付ける

import os
import sys
from google import genai
from PIL import Image

api_key = os.environ.get("GEMINI_API_KEY")
if not api_key:
    print("GEMINI_API_KEY を指定してください")
    sys.exit(1)

img_path = sys.argv[1] if len(sys.argv) > 1 else None
if not img_path or not os.path.exists(img_path):
    print("画像パスを指定してください")
    sys.exit(1)

model = os.environ.get("GEMINI_MODEL", "gemini-2.5-pro")

client = genai.Client(api_key=api_key)
image = Image.open(img_path)

response = client.models.generate_content(
    model=model,
    contents=[
        image,
        (
            "この原稿用紙の画像から、文字を正確にテキストとして抽出してください。改行も再現してください。"
        ),
    ],
)

print(f"モデル: {model}\n画像: {img_path}\n")
print("============ Gemini SDK 読み取り結果 ============\n")
print((response.text or "(テキストなし)").strip())
print("\n=================================================")
print(f"文字数: {len((response.text or '').strip())}")
