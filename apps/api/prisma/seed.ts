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
