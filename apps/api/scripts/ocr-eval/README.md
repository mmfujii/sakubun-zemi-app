# OCRプロンプト実験 & 復帰ポイント

現状ベスト＝「二重錨（Cloud Vision + Document AI）＋ Gemini校正（厳格プロンプト）」。正解比 約90%。
ここを基準に、安全にプロンプトを試すための仕組み。

## ファイル
- `ground_truth.txt` … 正解（実際の作文の手書き起こし）。スコア計算の基準。
- `prompt.txt` … 実験用のプロンプト指示文。**ここを編集して試す。**
- `prompt_baseline.txt` … 凍結版（編集しない）。戻すときの原本。
- `baseline_output.txt` … 現状ベスト出力（約90%）。目視比較用。

## 使い方（プロンプト探索）
1. `prompt.txt` を編集する
2. 実行（merge_ocr_gemini.py）。末尾に「文字一致率 ◯◯%」が出る
3. 90%を上回れば採用、下回れば戻す：
   ```
   cp prompt_baseline.txt prompt.txt
   ```

## 実行コマンド
```
cd apps/api
VISION_API_KEY=... GEMINI_API_KEY=... \
DOCAI_TOKEN=$(gcloud auth print-access-token) \
DOCAI_PROJECT=sakubun-zemi DOCAI_LOCATION=us DOCAI_PROCESSOR_ID=d4678ae9ee993b8a \
python3 scripts/merge_ocr_gemini.py ~/Documents/Claude/Projects/sakubunn/IMG_7140.jpg
```

## 完全に元へ戻したいとき（gitタグ）
この状態は git タグ `ocr-baseline-v1` で固定済み。何をやっても戻せる：
```
git checkout ocr-baseline-v1 -- apps/api/scripts apps/api/src/ocr.ts
```
