import { http, HttpResponse } from "msw";
import type { DashboardSummary } from "@sakubun-zemi/schemas";

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

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export const handlers = [
  http.get(`${API_BASE}/dashboard`, () => {
    return HttpResponse.json(mockDashboard);
  }),
];
