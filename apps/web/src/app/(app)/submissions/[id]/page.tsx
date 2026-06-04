"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Star,
  Award,
  BookOpen,
  Dumbbell,
  Target,
  Puzzle,
  Sparkles,
  Lightbulb,
  TrendingUp,
  BarChart3,
  Search,
  MessageCircle,
  Home,
  Pin,
  PenLine,
  FileText,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Users,
} from "lucide-react";
import { getSubmission } from "@/lib/api/submission";
import Genkouyoushi from "@/components/Genkouyoushi";
import type { SubmissionDetail } from "@sakubun-zemi/schemas";

// ────────────────────────────────────────────────────────────
// Domain helpers
// ────────────────────────────────────────────────────────────

const scoreLabel = (score: number) => {
  if (score >= 80) return "素晴らしい作文！";
  if (score >= 60) return "よくできました！";
  if (score >= 40) return "基礎ができています";
  return "もう少し練習しよう";
};

const ScoreIcon = ({ score }: { score: number }) => {
  if (score >= 80) return <Star size={28} />;
  if (score >= 60) return <Award size={28} />;
  if (score >= 40) return <BookOpen size={28} />;
  return <Dumbbell size={28} />;
};

const barColor = (score: number) => {
  if (score >= 20) return "bg-brand";
  if (score >= 15) return "bg-amber-400";
  return "bg-red-400";
};

const scoreItems = [
  { label: "課題把握力", key: "taskAlignment" as const, icon: <Target size={14} /> },
  { label: "論理性", key: "logic" as const, icon: <Puzzle size={14} /> },
  { label: "表現力", key: "expression" as const, icon: <Sparkles size={14} /> },
  { label: "独自性", key: "originality" as const, icon: <Lightbulb size={14} /> },
];

// ────────────────────────────────────────────────────────────
// Skeleton
// ────────────────────────────────────────────────────────────

function ResultSkeleton() {
  return (
    <div className="animate-fade-in">
      <div className="px-5 pt-4 pb-3 flex items-center gap-3">
        <div className="skeleton w-8 h-8 rounded-full" />
        <div className="skeleton h-5 w-20" />
      </div>
      <div className="px-5 py-5 space-y-4">
        <div className="skeleton rounded-3xl h-40" />
        <div className="skeleton rounded-2xl h-32" />
        <div className="skeleton rounded-2xl h-32" />
        <div className="skeleton rounded-2xl h-16" />
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Result content (new format only)
// ────────────────────────────────────────────────────────────

function ResultContent({ data }: { data: SubmissionDetail }) {
  const router = useRouter();
  const [showParent, setShowParent] = useState(false);

  const { score, scores, child, parent, grammarNotes, kanjiNotes } = data;

  return (
    <div className="animate-fade-in">
      {/* Sticky header */}
      <div
        className="px-5 pt-4 pb-3 flex items-center gap-3 sticky top-0 z-10"
        style={{ background: "rgba(255,253,248,0.9)", backdropFilter: "blur(8px)" }}
      >
        <button
          onClick={() => router.push("/history")}
          className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
          style={{ background: "#e8f0ea" }}
        >
          <ChevronLeft size={16} strokeWidth={2.5} color="#2f6e59" />
        </button>
        <h1 className="text-base font-bold" style={{ color: "#2f6e59" }}>
          添削結果
        </h1>
      </div>

      <div className="px-5 py-5">
        <div className="bg-white rounded-3xl shadow-soft-lg border border-gray-100 overflow-hidden">
          {/* Score card */}
          <div
            className="p-6 text-center animate-slide-up relative overflow-hidden"
            style={{ background: "#f4d944 url(/yellow-texture.png)", backgroundSize: "400px 400px" }}
          >
            <div className="mb-1 relative flex justify-center" style={{ color: "#2f6e59" }}>
              <ScoreIcon score={score} />
            </div>
            <div className="flex items-baseline justify-center gap-1 relative">
              <span className="text-6xl font-extrabold tabular-nums" style={{ color: "#1a3d32" }}>
                {score}
              </span>
              <span className="text-xl font-medium" style={{ color: "#2f6e59" }}>
                /100
              </span>
            </div>
            <p className="text-sm mt-2 font-medium" style={{ color: "#2f6e59" }}>
              {scoreLabel(score)}
            </p>
          </div>

          <div className="p-5 space-y-4">
            {/* Praise */}
            <div className="bg-emerald-50 rounded-2xl p-5 ring-1 ring-emerald-100 animate-slide-up stagger-2">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Sparkles size={16} />
                </div>
                <p className="text-base font-bold text-emerald-800">よかったところ</p>
              </div>
              <ul className="space-y-2">
                {child.praise.map((s, i) => (
                  <li key={i} className="text-sm text-emerald-800 leading-relaxed flex gap-2">
                    <span className="text-emerald-400 mt-0.5 flex-shrink-0">●</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Focus points */}
            <div className="bg-amber-50 rounded-2xl p-5 ring-1 ring-amber-100 animate-slide-up stagger-3">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                  <TrendingUp size={16} />
                </div>
                <p className="text-base font-bold text-amber-800">今回なおすところ</p>
              </div>
              <ul className="space-y-3">
                {child.focusPoints.map((fp, i) => (
                  <li key={i} className="bg-white/60 rounded-xl px-3 py-3">
                    <p className="text-sm text-amber-800 font-bold leading-relaxed">{fp.point}</p>
                    <p className="text-xs text-amber-600 mt-1.5 leading-relaxed flex items-start gap-1.5">
                      <Lightbulb size={14} className="text-amber-400 mt-0.5 flex-shrink-0" />
                      <span>{fp.how}</span>
                    </p>
                  </li>
                ))}
              </ul>
            </div>

            {/* Next step */}
            <div className="bg-gradient-to-br from-brand-50 to-brand-light rounded-2xl p-5 ring-1 ring-brand-200 animate-slide-up stagger-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center">
                  <Target size={16} />
                </div>
                <p className="text-base font-bold text-brand-dark">次にがんばること</p>
              </div>
              <p className="text-sm text-brand-700 leading-relaxed">{child.nextStep}</p>
            </div>

            {/* Parent toggle */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowParent((v) => !v)}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 text-sm font-bold transition-all duration-200 active:scale-[0.98] ${
                  showParent
                    ? "border-slate-400 bg-slate-100 text-slate-700"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                }`}
              >
                <Users size={16} />
                {showParent ? "保護者向け分析を閉じる" : "保護者向け分析を見る"}
                <ChevronDown
                  size={16}
                  className={`transition-transform duration-200 ${showParent ? "rotate-180" : ""}`}
                />
              </button>
            </div>

            {showParent && (
              <div className="space-y-4 animate-scale-in">
                {/* Summary */}
                <div className="bg-slate-50 rounded-2xl p-5 ring-1 ring-slate-200">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-slate-200 flex items-center justify-center">
                      <BarChart3 size={14} className="text-slate-600" />
                    </div>
                    <p className="text-sm font-bold text-slate-800">総合所見</p>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">{parent.summary}</p>
                </div>

                {/* Issue breakdown */}
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-soft">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
                      <Search size={14} />
                    </div>
                    <p className="text-sm font-bold text-gray-900">分析内訳</p>
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-gray-50 rounded-xl px-3 py-2 text-center flex-1">
                      <p className="text-lg font-bold text-gray-800">{parent.issueBreakdown.totalCount}</p>
                      <p className="text-[10px] text-gray-500">検出した課題</p>
                    </div>
                    <ChevronRight size={14} strokeWidth={2.5} className="text-gray-400 flex-shrink-0" />
                    <div className="bg-brand-light rounded-xl px-3 py-2 text-center flex-1">
                      <p className="text-lg font-bold text-brand-dark">{parent.issueBreakdown.shownToChild}</p>
                      <p className="text-[10px] text-brand">子どもに提示</p>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {Object.entries(parent.issueBreakdown.categories).map(([cat, count]) => (
                      <div key={cat} className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">{cat}</span>
                        <span className="font-bold text-gray-800 tabular-nums">{count}件</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Why these */}
                <div className="bg-slate-50 rounded-2xl p-5 ring-1 ring-slate-200">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-slate-200 flex items-center justify-center">
                      <MessageCircle size={14} className="text-slate-600" />
                    </div>
                    <p className="text-sm font-bold text-slate-800">今回このポイントを選んだ理由</p>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">{parent.whyThese}</p>
                </div>

                {/* Home advice */}
                <div className="bg-slate-50 rounded-2xl p-5 ring-1 ring-slate-200">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-slate-200 flex items-center justify-center">
                      <Home size={14} className="text-slate-600" />
                    </div>
                    <p className="text-sm font-bold text-slate-800">ご家庭での声かけ</p>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">{parent.homeAdvice}</p>
                </div>

                {/* Grammar notes */}
                {grammarNotes.length > 0 && (
                  <div className="bg-slate-50 rounded-2xl p-5 ring-1 ring-slate-200">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-lg bg-slate-200 flex items-center justify-center">
                        <Pin size={14} className="text-slate-600" />
                      </div>
                      <p className="text-sm font-bold text-slate-800">表記・文法の指摘</p>
                    </div>
                    <ul className="space-y-3">
                      {grammarNotes.map((note, i) => (
                        <li key={i} className="text-xs text-slate-700 leading-relaxed">
                          {note.suggestion ? (
                            <div className="bg-white/60 rounded-xl px-3 py-2.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="line-through opacity-50 bg-slate-200 px-1.5 py-0.5 rounded">
                                  {note.original}
                                </span>
                                <ChevronRight size={14} strokeWidth={2.5} className="text-slate-400 flex-shrink-0" />
                                <span className="font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded">
                                  {note.suggestion}
                                </span>
                              </div>
                              {note.reason && (
                                <p className="text-slate-500 mt-1.5 text-[11px]">{note.reason}</p>
                              )}
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <span className="text-slate-400 mt-0.5 flex-shrink-0">●</span>
                              <span>{note.original}</span>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Kanji notes */}
                {kanjiNotes.length > 0 && (
                  <div className="bg-slate-50 rounded-2xl p-5 ring-1 ring-slate-200 animate-fade-in">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-lg bg-slate-200 flex items-center justify-center">
                        <PenLine size={14} className="text-slate-600" />
                      </div>
                      <p className="text-sm font-bold text-slate-800">漢字で書けるとさらに良いところ</p>
                    </div>
                    <ul className="space-y-2">
                      {kanjiNotes.map((s, i) => (
                        <li key={i} className="text-xs text-slate-700 leading-relaxed flex gap-2">
                          <span className="text-slate-400 mt-0.5 flex-shrink-0">●</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Score bars */}
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-soft space-y-4">
                  <p className="text-xs font-bold text-gray-900 mb-1">カテゴリ別スコア</p>
                  {scoreItems.map((item) => {
                    const s = scores[item.key].score;
                    return (
                      <div key={item.key}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs text-gray-600 flex items-center gap-1.5">
                            {item.icon}
                            <span className="font-medium">{item.label}</span>
                          </span>
                          <span className="text-sm font-bold text-gray-800 tabular-nums">
                            {s}
                            <span className="text-gray-400 font-normal">/25</span>
                          </span>
                        </div>
                        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ease-out ${barColor(s)}`}
                            style={{ width: `${(s / 25) * 100}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Score detail comments */}
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-soft">
                  <p className="text-sm font-bold text-gray-900 mb-4">採点コメント</p>
                  <div className="space-y-4">
                    {scoreItems.map((item) => {
                      const s = scores[item.key];
                      return (
                        <div key={item.key} className="border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                              {item.icon} {item.label}
                            </span>
                            <span
                              className={`text-xs font-bold tabular-nums ${
                                s.score >= 20
                                  ? "text-brand"
                                  : s.score >= 15
                                    ? "text-amber-500"
                                    : "text-red-500"
                              }`}
                            >
                              {s.score}/25
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 leading-relaxed">{s.comment}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Original essay */}
        <div className="animate-slide-up stagger-6 mt-4">
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(255,253,248,0.15)" }}
            >
              <FileText size={14} color="#fffdf8" />
            </div>
            <p className="text-sm font-bold" style={{ color: "#fffdf8" }}>
              提出した作文
            </p>
          </div>
          <Genkouyoushi text={data.rawText} title={data.title ?? undefined} compact />
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Page
// ────────────────────────────────────────────────────────────

export default function SubmissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["submission", id],
    queryFn: () => getSubmission(id),
  });

  if (isLoading) return <ResultSkeleton />;

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-6 text-center">
        <p className="font-bold text-lg" style={{ color: "#fffdf8" }}>
          添削結果が見つかりません
        </p>
        <p className="text-sm" style={{ color: "rgba(255,253,248,0.7)" }}>
          このIDの添削は存在しないか、削除された可能性があります。
        </p>
        <Link
          href="/history"
          className="mt-2 inline-flex items-center gap-1 px-5 py-2.5 rounded-full text-sm font-bold transition-all active:scale-95"
          style={{
            background: "rgba(255,253,248,0.2)",
            border: "1px solid rgba(255,253,248,0.3)",
            color: "#fffdf8",
          }}
        >
          履歴に戻る
        </Link>
      </div>
    );
  }

  return <ResultContent data={data} />;
}
