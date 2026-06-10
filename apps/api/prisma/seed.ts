import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const prompts = [
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

async function main() {
  console.log("Seeding prompts...");

  for (const prompt of prompts) {
    await prisma.prompt.upsert({
      where: { id: prompt.id },
      update: {
        title: prompt.title,
        body: prompt.body,
        category: prompt.category,
      },
      create: {
        id: prompt.id,
        title: prompt.title,
        body: prompt.body,
        category: prompt.category,
        isActive: true,
      },
    });
    console.log(`  upserted: ${prompt.id} — ${prompt.title}`);
  }

  // 仮の開発ユーザー（認証導入までの暫定。Submission.userId が指す先）。
  // サンプル作文より「先に」作る必要がある（外部キー制約のため）。
  await prisma.profile.upsert({
    where: { id: "dev-user-001" },
    update: {},
    create: { id: "dev-user-001", displayName: "開発ユーザー" },
  });
  console.log("  upserted profile: dev-user-001");

  // 完成済みのサンプル添削（結果画面の表示用。本来はb2でClaudeが生成する）
  await prisma.submission.upsert({
    where: { id: "seed-sub-001" },
    update: {},
    create: {
      id: "seed-sub-001",
      userId: "dev-user-001",
      promptId: "prompt-001",
      theme: "夏休みの思い出",
      rawText:
        "ぼくは夏休みに家族で海に行きました。波がざぶんざぶんとやってきて、はじめはこわかったけど、お父さんと入ったら楽しくなりました。すなはまでかにをつかまえたのが一番たのしかったです。また来年も行きたいです。",
      status: "completed",
      feedback: {
        create: {
          overallScore: 76,
          result: {
            scores: {
              taskAlignment: {
                score: 19,
                comment: "海での体験という題に正面から向き合えています。",
              },
              logic: { score: 17, comment: "時間順に書けていますが、つながりをもう少し明確に。" },
              expression: { score: 22, comment: "「ざぶんざぶん」など擬音が生き生きしています。" },
              originality: { score: 18, comment: "自分の体験が具体的で良いです。" },
            },
            child: {
              praise: ["波の音を擬音でうまく表せています。", "気持ちの変化が書けています。"],
              focusPoints: [
                {
                  point: "段落の最初を一字下げよう",
                  how: "新しい話題は行を変えて一マス空けるよ。",
                },
                {
                  point: "気持ちの理由も書こう",
                  how: "「なぜ楽しかったか」を一文足すと伝わるよ。",
                },
              ],
              nextStep: "次は『一番言いたいこと』を最初に決めてから書いてみよう。",
            },
            parent: {
              summary: "体験を具体的に描写する力が育っています。理由づけを足すとさらに伸びます。",
              issueBreakdown: {
                totalCount: 5,
                shownToChild: 2,
                categories: { "構成・段落": 2, "表現・語彙": 1, "表記・文法": 1, 字数: 1 },
              },
              whyThese: "今の学年で伸ばしやすい2点に絞って提示しました。",
              homeAdvice: "「どこが一番楽しかった？」と理由を引き出す声かけが効果的です。",
            },
            grammarNotes: [
              { original: "つかまえた", suggestion: "捕まえた", reason: "「捕」は習う漢字です。" },
            ],
            kanjiNotes: ["「いく」→「行く」（小1で習う漢字です）"],
          },
        },
      },
    },
  });
  console.log("  upserted sample submission: seed-sub-001");

  console.log(`Seeding complete. ${prompts.length} prompts upserted.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
