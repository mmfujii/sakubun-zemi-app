# 写真OCR パイプライン解説

`apps/api/src/ocr.ts` の設計と意図。将来の自分・引き継ぎ・(b)専用原稿用紙プロジェクト着手時の参照用。
（2026-06-22 / 正解比 約94.8%、捏造なし）

## 全体の流れ

```
写真 → [フロント前処理] → POST /ocr → ① Cloud Vision ＋ ② Document AI（並行）
     → ③ Gemini校正（両下書き＋画像）→ 崩壊チェック → 編集画面 → 添削
```

設計の核：**「読む(専用OCR)」と「直す(LLM)」を分離**。LLMに画像を直接読ませると流暢に捏造するため、読みは専用OCRに任せ、LLMは画像照合の“校正係”に徹させる。

## ① フロント前処理（`apps/web/src/components/ImageUploader.tsx`）

送信前にcanvasで整える：EXIF向き補正＋手動回転 / 明るさ・コントラスト・ぼけの品質チェック＋自動補正 / グレースケール＋コントラスト強調(`enhanceForOCR`) / 長辺2400pxへリサイズ / JPEG化 → data URLで `POST /ocr`。

## ② Cloud Vision + Document AI（`ocrImages` 内で `Promise.all` 並行）

- **Cloud Vision** (`visionOcr`): `DOCUMENT_TEXT_DETECTION` + `languageHints:["ja"]`。APIキー認証。忠実だが汚い所は文字化け・断片化。
- **Document AI** (`docaiOcr`): Document OCRプロセッサ。`google-auth-library`で認証（本番=`GCP_SERVICE_ACCOUNT_JSON`、ローカル=`gcloud auth application-default login`のADC）。**未設定/失敗なら`null`→Vision単体に自動フォールバック**。
- VisionとDocAIは**壊れる箇所が違う**ため相互補完＝「二重錨」。

## ③ Gemini校正（`geminiMerge`）

両OCR下書き(A=Vision, B=DocAI)＋**元画像**を Gemini（既定`gemini-2.5-pro`）に渡し校正。
- `temperature: 0`
- **proは動的思考**（思考を絞ると言い換えが増えたため、`thinkingConfig`は付けない。flashのみ`thinkingBudget:0`）
- `maxOutputTokens: 16000`（思考＋本文が詰まって空出力になるのを防ぐ。空なら`GEMINI_EMPTY`で失敗）

## プロンプト（`MERGE_INSTRUCTION`）と各ルールの意図

> 出力は「子どもが実際に書いた作文の本文」を、書かれているとおりに復元したもの。1文字も創作・修正・整形しない。
> 1. 下書きの語を省略しない（「逆に」「など」等の副詞・接続・語尾を落とさない）
> 2. 複数下書きが一致する箇所は1字も変えない。食い違い/壊れた所だけ画像で確認して採る
> 3. 長さが違うときは語が欠けていない方を基準に（短く要約された方に引っ張られない）
> 4. 言い換え・語尾調整・助詞補完/修正・文法修正・自然化を一切しない（子の誤字・拙さも温存）
> 5. 升目番号・字数マーカー・「※」・問題番号などの非本文は除く
> 6. どの下書きにも無く画像でも読めない箇所だけ □
> 7. 出力は本文のみ
> ＋ few-shot例（やる気を失ったり/方法が同じだと/上がるなくなる/逆に上がるような の○✗）

- 最優先「創作・修正・整形しない」＝添削サービスなので子の原文改変は致命的。
- ルール1,3＝検証で多発した「脱落」を抑制。
- ルール2＝二重錨の肝（一致＝高信頼、触らない）。
- ルール4＝LLMの“親切な言い換え”を封じる（誤字は添削対象なので残す）。
- **few-shot例が 93.3%→94.8% の決め手**。

## 安全機構

- **フォールバック**: DocAI不調でもVision単体で続行。
- **崩壊検知** (`looksDegenerate`): 200字以上で「長さ10の部分文字列の異なり率<0.35」＝同語ループを検知→失敗扱いにし壊れた出力を見せない。
- **編集ステップ**: 結果は編集可能欄＋写真並列。OCRは“補助”、最後はユーザーが確認・修正する前提。

## 設定（env）

`CLOUD_VISION_API_KEY`, `GEMINI_API_KEY`, `GEMINI_OCR_MODEL`(=gemini-2.5-pro), `DOCAI_PROJECT`, `DOCAI_LOCATION`(=us), `DOCAI_PROCESSOR_ID`, 本番のみ`GCP_SERVICE_ACCOUNT_JSON`。ローカルは`QUOTA_ENABLED=false`で課金ゲート無効。

## 限界と次の道

- 任意写真の天井＝**約94.8%**。プロンプトは頭打ち。
- **dewarp/トリミングは不採用**: 四隅が少しズレると逆に悪化（実測77〜86%）。任意写真では高分散で割に合わない。
- **99%級への唯一の道(b)**: 四隅マーク付き専用原稿用紙→マークで確実検出→ズレないdewarp＋升目ごとに1文字OCR。要・紙の採用＋実装。

## 開発ツール

- gitタグ `ocr-app-baseline-v1`（戻せる基準）。
- `apps/api/scripts/ocr-eval/`: `ground_truth.txt`＋`prompt.txt`/`prompt_baseline.txt`＋自動スコア比較。
- `scripts/merge_ocr_gemini.py`（第2引数でプロンプト差替・一致率表示）、各エンジン検証スクリプト、`dewarp-tool.html`。
- **プロンプト改良は必ずこのハーネスでスコア比較してから本番反映する運用。**
