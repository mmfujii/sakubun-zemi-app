import type { Prompt } from "@sakubun-zemi/schemas";
import { HttpResponse, http } from "msw";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

// モジュールトップで共有 — /prompts と /prompts/:id の両方で使用
const mockPrompts: Prompt[] = [
  {
    id: "prompt-001",
    title: "夏休みの思い出",
    body: "あなたが今年の夏休みに体験した中で、一番印象に残っていることを書きなさい。そのときどんな気持ちだったか、くわしく書きましょう。",
    category: "テーマ作文",
  },
  {
    id: "prompt-002",
    title: "わたしの宝物",
    body: "あなたにとって大切な「宝物」について書きなさい。それがなぜ大切なのか、どんな思い出があるのかを書きましょう。",
    category: "テーマ作文",
  },
  {
    id: "prompt-003",
    title: "10年後のわたし",
    body: "10年後、あなたはどんな自分になっていたいですか。なりたい自分と、そのためにいま努力していることを書きなさい。",
    category: "テーマ作文",
  },
  {
    id: "prompt-004",
    title: "学校に給食は必要か",
    body: "学校の給食は必要だと思いますか。あなたの意見を、理由を挙げながら書きなさい。反対意見も考えた上で、自分の立場を明確にしましょう。",
    category: "いけん作文",
  },
  {
    id: "prompt-005",
    title: "ゲームは1日何時間まで？",
    body: "子どもがゲームをする時間について、あなたはどう思いますか。時間を決めるべきかどうか、理由とともに自分の意見を書きなさい。",
    category: "いけん作文",
  },
  {
    id: "prompt-006",
    title: "好きなことについて書こう",
    body: "あなたが最近夢中になっていることや、好きなことについて自由に書きなさい。どこが好きなのか、どんな楽しさがあるのかを書きましょう。",
    category: null,
  },
];

// const mockHistoryItems = [
//   {
//     id: "sub-004",
//     title: "夏休みの思い出",
//     createdAt: "2026-06-01T10:00:00+09:00",
//     score: 90,
//     category: "テーマ作文",
//   },
//   {
//     id: "sub-001",
//     title: "無題の作文",
//     createdAt: "2026-05-20T10:00:00+09:00",
//     score: 82,
//     category: null,
//   },
//   {
//     id: "sub-005",
//     title: "学校に給食は必要か",
//     createdAt: "2026-05-15T10:00:00+09:00",
//     score: 76,
//     category: "いけん作文",
//   },
//   {
//     id: "sub-002",
//     title: "無題の作文",
//     createdAt: "2026-05-12T10:00:00+09:00",
//     score: 76,
//     category: null,
//   },
//   {
//     id: "sub-006",
//     title: "わたしの宝物",
//     createdAt: "2026-05-01T10:00:00+09:00",
//     score: 68,
//     category: "テーマ作文",
//   },
//   {
//     id: "sub-007",
//     title: "ゲームは1日何時間まで？",
//     createdAt: "2026-04-20T10:00:00+09:00",
//     score: 55,
//     category: "いけん作文",
//   },
//   {
//     id: "sub-003",
//     title: "あなたが最近うれしかったことについて、そのときの気持ちやそこから学んだことを書きなさい",
//     createdAt: "2026-04-01T10:00:00+09:00",
//     score: 76,
//     category: null,
//   },
// ];

// const mockHistory: HistoryResponse = {
//   totalCount: mockHistoryItems.length,
//   avgScore:
//     Math.round(
//       (mockHistoryItems.reduce((sum, item) => sum + item.score, 0) /
//         mockHistoryItems.length) *
//         10
//     ) / 10,
//   items: mockHistoryItems,
// };

// const mockSubmission: SubmissionDetail = {
//   id: "sub-001",
//   title: "夏休みの思い出",
//   rawText:
//     "ぼくは夏休みに家族で海に行きました。\n海はとても広くて、波がざぶんざぶんとやってきました。はじめはこわかったけど、お父さんと一緒に入ったら楽しくなりました。\nすなはまでやどがにをつかまえたのがいちばんたのしかったです。小さなかにが手の上でうごいてくすぐったかったです。\nかえりにやきそばをたべました。外でたべるごはんはいつもよりおいしく感じました。\nまた来年も海に行きたいと思います。来年はもっと遠くまで泳げるようにれんしゅうします。",
//   createdAt: "2026-06-01T10:00:00+09:00",
//   score: 76,
//   scores: {
//     taskAlignment: {
//       score: 19,
//       comment:
//         "海での体験という課題に正面から向き合えています。具体的な場面を選んで書けており、課題の意図をよく理解しています。",
//     },
//     logic: {
//       score: 17,
//       comment:
//         "時間の流れに沿って出来事を書けています。ただ、各エピソードのつながりがもう少し明確だとさらに読みやすくなります。",
//     },
//     expression: {
//       score: 22,
//       comment:
//         "「ざぶんざぶん」などの擬音語を使って場面を生き生きと表現できています。感覚的な描写が読み手に伝わりやすいです。",
//     },
//     originality: {
//       score: 18,
//       comment:
//         "やどがにをつかまえたエピソードは独自性があります。自分だけの体験として印象に残る描写ができています。",
//     },
//   },
//   child: {
//     praise: [
//       "「ざぶんざぶん」という言葉で、波の感じがとてもよく伝わりました！",
//       "かにが手の上でくすぐったかったようすが、読んでいるこっちまで楽しくなりました。",
//     ],
//     focusPoints: [
//       {
//         point: "段落のはじめは一文字あける",
//         how: "新しい話題が始まるときは、文の最初を一マス空けて書くと、読む人がわかりやすくなるよ。",
//       },
//       {
//         point: "ひらがなで書けている漢字を使ってみる",
//         how: "「れんしゅう」は「練習」、「かえり」は「帰り」と書けるよ。知っている漢字をどんどん使ってみよう。",
//       },
//     ],
//     nextStep:
//       "次の作文では、一番心に残った場面をもっとくわしく書いて、そのときどう思ったかを一文加えてみよう。",
//   },
//   parent: {
//     summary:
//       "全体として課題に沿った内容で、具体的な体験が丁寧に書かれています。擬音語や感覚的な表現を自然に使えており、表現力に光るものがあります。段落構成の基礎（冒頭一字下げ）と常用漢字の活用が今後の重点課題です。文章量も適切で、思考を言語化する力が着実についています。",
//     issueBreakdown: {
//       totalCount: 5,
//       shownToChild: 2,
//       categories: {
//         "構成・段落": 2,
//         "表記・文法": 1,
//         "表現・語彙": 1,
//         字数の過不足: 1,
//       },
//     },
//     whyThese:
//       "段落の冒頭一字下げは作文の基本ルールであり、早期に習慣づけることが重要です。漢字については現学年で習得済みの文字が複数ひらがなのまま使われており、表記力の底上げに直結するため選びました。",
//     homeAdvice:
//       "「この場面でどう感じた？」と声をかけながら、気持ちを言葉にする練習をしてみてください。書く前に話して整理すると、文章に深みが出やすくなります。漢字ドリルよりも「書いた作文の中の言葉を漢字に直す」練習が定着しやすいです。",
//   },
//   grammarNotes: [
//     {
//       original: "れんしゅうします",
//       suggestion: "練習します",
//       reason: "「練習」は小学3年生で習う漢字です。",
//     },
//     {
//       original: "かえりに",
//       suggestion: "帰りに",
//       reason: "「帰」は小学2年生で習う漢字です。",
//     },
//     {
//       original: "たのしかった",
//       suggestion: "楽しかった",
//       reason: "「楽」は小学2年生で習う漢字です。",
//     },
//   ],
//   kanjiNotes: [
//     "「うごいて」→「動いて」（小学3年生で習う漢字です）",
//     "「ひろくて」→「広くて」（小学2年生で習う漢字です）",
//     "「いっしょに」→「一緒に」（「一」は小学1年生、「緒」は常用漢字です）",
//   ],
// };

export const handlers = [
  // /dashboard は本物のHono+DB（Client ComponentがuseQueryで取得）に移行済み。
  // /prompts（お題一覧）は本物のHono+DBに移行済み。
  // ここでハンドラを外すと MSW は素通り(bypass)し、リクエストが実APIに届く。
  // http.get(`${API_BASE}/prompts`, () => {
  //   return HttpResponse.json({ prompts: mockPrompts });
  // }),
  http.get(`${API_BASE}/prompts/:id`, ({ params }) => {
    const prompt = mockPrompts.find((p) => p.id === params.id);
    if (!prompt) {
      return new HttpResponse(null, { status: 404 });
    }
    return HttpResponse.json(prompt);
  }),
  // /history は本物のHono+DB（Server Componentがサーバーで取得）に移行済み。
  // http.get(`${API_BASE}/history`, () => {
  //   return HttpResponse.json(mockHistory);
  // }),
  // http.get(`${API_BASE}/submissions/:id`, () => {
  //   return HttpResponse.json(mockSubmission);
  // }),
];
