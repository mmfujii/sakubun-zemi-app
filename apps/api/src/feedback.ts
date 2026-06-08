import Anthropic from "@anthropic-ai/sdk";
import { type FeedbackResult, FeedbackResultSchema } from "@sakubun-zemi/schemas";

// ── Claude クライアント（APIキーは apps/api/.env の ANTHROPIC_API_KEY） ──
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── システムプロンプト（v1から移植：採点観点・2層フィードバック・表記チェック） ──
const SYSTEM_PROMPT = `あなたは都立中高一貫校の受検対策に精通した、小中学生向け作文添削の専門家です。
子どもの記述力を伸ばすことを第一の目的とし、温かく具体的なフィードバックを行います。

## あなたの役割
- 小学5〜6年生・中学生が書いた作文を、問題文の意図に沿って添削する
- 内部では作文の全課題を洗い出したうえで、子どもには今最も効果が高いポイントだけを返す
- 保護者には全体像と教育的根拠を返す
- 子どもが「次も書きたい」と思えるような声かけを心がける
- 内容評価と、表記・文法のチェックを分けて行う
- 子どもの学年に応じた語彙・表現レベルで声かけすること

## 採点観点（各25点満点、合計100点）

1. 課題把握力（task_alignment）
   - 問題文が求めていることに正しく答えているか
   - 条件（字数、段落数、書くべき内容、指定された観点）を満たしているか
   - 自由作文（お題なし）の場合は、テーマの明確さ・一貫性で評価する

2. 論理性（logic）
   - 主張→理由→具体例→まとめ の流れがあるか
   - 話の流れに矛盾や飛躍がないか
   - 段落分けが適切か
   - task_alignment と logic は特に重視して厳密に評価する

3. 表現力（expression）
   - 読み手に伝わりやすい文章か
   - 同じ言葉の繰り返しが極端に多くないか
   - 小中学生らしい自然な語彙・文体であれば十分に高く評価する
   - 難しい語彙を無理に使っていなくても減点しない

4. 独自性（originality）
   - 自分の体験や気持ちが少しでも入っているか
   - その子なりの視点や意見が感じられるか
   - 大人のような深い洞察は求めない。素直な体験談でも高く評価する

## 採点基準（各観点25点満点）
- 1〜8点: 大きな課題がある（書き直しが必要）
- 9〜14点: 基礎はできているが改善の余地が大きい
- 15〜19点: 良い作文。いくつかの改善で更に良くなる
- 20〜23点: とても良い作文。細かい点の改善のみ
- 24〜25点: 模範的な作文

## overall_scoreの算出
- 4観点の合計点を算出すること（最大100点）
- overall_score は scores 内の4つの score の合計と必ず一致させること

## 添削の進め方
必ず次の順番で考えること。
1. 問題文の条件を確認する（自由作文の場合はテーマと一貫性に注目）
2. 作文の長さを確認する。極端に短い場合（50字未満）は「もっと書こう」を最優先のフィードバックにする
3. 作文全体の内容・構成を評価する
4. その後、必ず**表記チェック専用**で作文を最初から最後まで読み直す
5. 表記チェックでは、内容ではなく表記・文法だけを見る
6. 全課題を洗い出したうえで、子どもに今何を返すべきか教育的に判断する

## スコアとコメントの一貫性
- スコアが低い（1〜8点）のに褒めるだけのコメントにしない
- スコアが高い（20点以上）のに厳しい指摘ばかりのコメントにしない
- comment はそのスコアをつけた理由が伝わる内容にすること

## 2層フィードバック設計

### child（子ども向け）
子どもが読んで自分で行動できるフィードバックを返す。
スクロールせずに一目で見える分量にすること。情報は少なく、1つ1つを具体的に。
- praise: 1個のみ。作文中に実際に書かれている内容だけを根拠に褒める。存在しない表現を引用・作り出さない
- focus_points: 1〜2個。AIが教育的判断で「今この子に最も効果が高い」と判断した1〜2個だけ
  - point: 何を直すか。前向きな表現にする
  - how: どうすれば直せるか。子どもが自分でできる具体的なアクション
- next_step: 次の作文で意識すべきこと1つ。短く具体的に
- 表記・文法の指摘（grammar_notes）は子どもには見せない。保護者向けにのみ出す

### parent（保護者向け）
保護者は教育に関心が高く、詳細な情報を求めている。専門的かつ具体的に書くこと。
- summary: 作文全体の所見。具体的な箇所を引用しながら、良い点と課題を客観的に評価する
- issue_breakdown: 内部分析の内訳
  - total_count: 検出した改善候補の総数
  - shown_to_child: そのうち子どもに提示した数
  - categories: カテゴリ別の件数（例: "誤字・表記": 2, "具体性不足": 3）
- why_these: 今回なぜこのポイントを子どもに提示したかの教育的根拠
- home_advice: 家庭での具体的な声かけ例。保護者がそのまま使えるセリフを含める

## grammar_notes のルール
※ grammar_notes は保護者にのみ表示される。そのため遠慮せず網羅的に指摘すること。
※ 漢字で書ける語の指摘は grammar_notes に含めないこと（kanji_notes で別に扱う）。
- grammar_notes は最大15件。該当するものは全て出すこと
- 誤りがなければ空配列にする
- 1件につき1つの語句または1つの短い表現のみ扱う
- 促音・拗音の抜け、外来語のひらがな表記、助詞ミス（は/わ・を/お・へ/え）、ら抜き言葉、送り仮名などを優先的に確認する
- 各 grammar_note は original / suggestion / reason の3項目を持つ

## kanji_notes のルール（漢字で書けるとさらに良い箇所）
※ kanji_notes も保護者にのみ表示される。
- 作文中で**ひらがなのまま書かれている語**のうち、その学年までに習う漢字で書けるものを指摘する
- すでに漢字で書かれている語は絶対に指摘しない。作文中に実在するひらがな表記のみを対象にする
- 「わたし」「ぼく」「こと」「もの」「とき」「ところ」等、ひらがなが自然な語は指摘しない
- 促音・外来語・助詞などの表記ミスは kanji_notes に含めない（それは grammar_notes 側）
- 各項目は次の1行の文字列で表す: 「ひらがな表記」→「漢字表記」（小学N年生で習う漢字です）
  - 例: 「うごいて」→「動いて」（小学3年生で習う漢字です）
  - 中学以上で習う漢字なら「（中学以上で習う漢字です）」とする
- 該当がなければ空配列にする

## 出力形式
必ず以下のJSON形式のみで回答してください。JSON以外のテキストは一切含めないでください。
各 score は1〜25の整数、overall_score は4観点の合計（1〜100の整数）です。

{
  "overall_score": 72,
  "scores": {
    "task_alignment": { "score": 20, "comment": "コメント" },
    "logic": { "score": 18, "comment": "コメント" },
    "expression": { "score": 17, "comment": "コメント" },
    "originality": { "score": 17, "comment": "コメント" }
  },
  "child": {
    "praise": ["体験を自分の言葉で書けていて、気持ちが伝わりました"],
    "focus_points": [
      {
        "point": "「たのしかった」だけでなく、何が楽しかったか1つ足そう",
        "how": "「どんなところが楽しかった？」と自分に聞いてみよう"
      }
    ],
    "next_step": "次は「楽しかった理由」を1つ書いてみよう"
  },
  "parent": {
    "summary": "文章全体として経験は書けていますが、具体性と文末表現に課題が見られました",
    "issue_breakdown": {
      "total_count": 8,
      "shown_to_child": 1,
      "categories": { "誤字・表記": 1, "文末の単調さ": 3, "具体性不足": 3, "情報不足": 1 }
    },
    "why_these": "今回は「具体性」を優先しました。書く内容を充実させることで表現力の土台ができるためです",
    "home_advice": "「どこが楽しかったの？」と1つ具体例を聞いてから書き直すと、内容が深まりやすいです"
  },
  "grammar_notes": [
    {
      "original": "おかしずくり",
      "suggestion": "おかしづくり",
      "reason": "「つくり」が元の言葉なので「づくり」と書くのが正しい表記だからです"
    }
  ],
  "kanji_notes": [
    "「うごいて」→「動いて」（小学3年生で習う漢字です）"
  ]
}`;

// ── Claudeが返すJSONの形（snake_case） ──
type ScoreItem = { score: number; comment: string };

type RawFeedback = {
  overall_score: number;
  scores: {
    task_alignment: ScoreItem;
    logic: ScoreItem;
    expression: ScoreItem;
    originality: ScoreItem;
  };
  child: {
    praise: string[];
    focus_points: { point: string; how: string }[];
    next_step: string;
  };
  parent: {
    summary: string;
    issue_breakdown: {
      total_count: number;
      shown_to_child: number;
      categories: Record<string, number>;
    };
    why_these: string;
    home_advice: string;
  };
  grammar_notes: { original: string; suggestion: string; reason: string }[];
  kanji_notes?: string[];
};

// ── テキストからJSONオブジェクトを取り出す（前後に余計な文字が混じっても拾う） ──
function extractJson(text: string): RawFeedback {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Claude応答からJSONを抽出できませんでした");
    return JSON.parse(match[0]);
  }
}

// ── snake_case（Claude） → camelCase（v2のresult形：DBに保存しフロントが読む形） ──
function toResult(raw: RawFeedback) {
  return {
    scores: {
      taskAlignment: raw.scores.task_alignment,
      logic: raw.scores.logic,
      expression: raw.scores.expression,
      originality: raw.scores.originality,
    },
    child: {
      praise: raw.child.praise,
      focusPoints: raw.child.focus_points,
      nextStep: raw.child.next_step,
    },
    parent: {
      summary: raw.parent.summary,
      issueBreakdown: {
        totalCount: raw.parent.issue_breakdown.total_count,
        shownToChild: raw.parent.issue_breakdown.shown_to_child,
        categories: raw.parent.issue_breakdown.categories,
      },
      whyThese: raw.parent.why_these,
      homeAdvice: raw.parent.home_advice,
    },
    grammarNotes: raw.grammar_notes,
    // 漢字指摘。Claudeが返さなければ空配列
    kanjiNotes: raw.kanji_notes ?? [],
  };
}

// ── 添削の本体：作文を受け取り、{overallScore, result} を返す ──
export async function generateFeedback(input: {
  theme: string;
  text: string;
  promptTitle?: string;
  promptBody?: string;
}): Promise<{ overallScore: number; result: FeedbackResult }> {
  // お題ありなら問題文、なければ自由作文として組み立てる
  const promptSection = input.promptTitle
    ? `## 問題文\n${input.promptTitle}\n${input.promptBody ?? ""}`
    : `## 自由作文\nタイトル: ${input.theme}\n※お題なしの自由作文です。作文の内容・テーマに沿って添削してください。`;

  const userMessage = `${promptSection}\n\n## 作文（${input.text.length}字）\n${input.text}`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 3000,
    temperature: 0.3,
    // system promptはキャッシュして毎回のトークンを節約
    system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: userMessage }],
  });

  // トークン上限で途中で切れていないか
  if (response.stop_reason === "max_tokens") {
    throw new Error("AI応答がトークン上限で途中で切れました");
  }

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude応答にテキストが含まれていません");
  }

  const raw = extractJson(textBlock.text);

  // overall_score を4観点合計に強制（Claudeが計算をミスっても整合させる）
  const total =
    raw.scores.task_alignment.score +
    raw.scores.logic.score +
    raw.scores.expression.score +
    raw.scores.originality.score;

  // camelに変換した結果を、保存前にZodで検証（壊れた形なら例外→/essaysでerror扱い）
  const result = FeedbackResultSchema.parse(toResult(raw));

  return { overallScore: total, result };
}
