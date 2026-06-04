import { http, HttpResponse } from "msw";
import type { DashboardSummary, PromptsResponse, HistoryResponse } from "@sakubun-zemi/schemas";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

const mockDashboard: DashboardSummary = {
  userName: "藤井 惣一朗",
  totalCount: 18,
  avgScore: 63.9,
  scoreTrend: { diff: -1.0 },
  recentSubmissions: [
    {
      id: "sub-001",
      title: "無題の作文",
      createdAt: "2026-05-20T10:00:00+09:00",
      score: 76,
    },
    {
      id: "sub-002",
      title: "無題の作文",
      createdAt: "2026-05-12T10:00:00+09:00",
      score: 76,
    },
    {
      id: "sub-003",
      title: "あなたが最近うれしかったことについて、そのときの気持ちやそこから学んだことを書きなさい",
      createdAt: "2026-04-01T10:00:00+09:00",
      score: 76,
    },
  ],
};

const mockPrompts: PromptsResponse = {
  prompts: [
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
  ],
};

const mockHistoryItems = [
  {
    id: "sub-004",
    title: "夏休みの思い出",
    createdAt: "2026-06-01T10:00:00+09:00",
    score: 90,
    category: "テーマ作文",
  },
  {
    id: "sub-001",
    title: "無題の作文",
    createdAt: "2026-05-20T10:00:00+09:00",
    score: 82,
    category: null,
  },
  {
    id: "sub-005",
    title: "学校に給食は必要か",
    createdAt: "2026-05-15T10:00:00+09:00",
    score: 76,
    category: "いけん作文",
  },
  {
    id: "sub-002",
    title: "無題の作文",
    createdAt: "2026-05-12T10:00:00+09:00",
    score: 76,
    category: null,
  },
  {
    id: "sub-006",
    title: "わたしの宝物",
    createdAt: "2026-05-01T10:00:00+09:00",
    score: 68,
    category: "テーマ作文",
  },
  {
    id: "sub-007",
    title: "ゲームは1日何時間まで？",
    createdAt: "2026-04-20T10:00:00+09:00",
    score: 55,
    category: "いけん作文",
  },
  {
    id: "sub-003",
    title: "あなたが最近うれしかったことについて、そのときの気持ちやそこから学んだことを書きなさい",
    createdAt: "2026-04-01T10:00:00+09:00",
    score: 76,
    category: null,
  },
];

const mockHistory: HistoryResponse = {
  totalCount: mockHistoryItems.length,
  avgScore:
    Math.round(
      (mockHistoryItems.reduce((sum, item) => sum + item.score, 0) /
        mockHistoryItems.length) *
        10
    ) / 10,
  items: mockHistoryItems,
};

export const handlers = [
  http.get(`${API_BASE}/dashboard`, () => {
    return HttpResponse.json(mockDashboard);
  }),
  http.get(`${API_BASE}/prompts`, () => {
    return HttpResponse.json(mockPrompts);
  }),
  http.get(`${API_BASE}/history`, () => {
    return HttpResponse.json(mockHistory);
  }),
];
