"use client";

import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  ChevronDown,
  ChevronRight,
  Home,
  Lightbulb,
  Loader2,
  MessageCircle,
  PenLine,
  Pin,
  Puzzle,
  Search,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

// ── 保護者分析データの型（本来は packages/schemas に置くのが理想） ──
type FeedbackScore = { score: number; comment: string };

type ParentData = {
  parent: {
    summary: string;
    issueBreakdown: {
      totalCount: number;
      shownToChild: number;
      categories: Record<string, number>;
    };
    whyThese: string;
    homeAdvice: string;
  };
  grammarNotes: { original: string; suggestion: string; reason: string }[];
  kanjiNotes: string[];
  scores: {
    taskAlignment: FeedbackScore;
    logic: FeedbackScore;
    expression: FeedbackScore;
    originality: FeedbackScore;
  };
};

// ── helper（page.tsx から移動） ──
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

// ── 島本体：開閉 + 取得 ──
export default function ParentAnalysis({ submissionId }: { submissionId: string }) {
  const [open, setOpen] = useState(false);

  const { data, isLoading, isError } = useQuery<ParentData>({
    queryKey: ["parent", submissionId],
    queryFn: () =>
      fetch(`${API_BASE}/submissions/${submissionId}/parent`).then((r) => {
        if (!r.ok) throw new Error("failed");
        return r.json();
      }),
    enabled: open, // 開くまで取りに行かない
  });

  return (
    <>
      <div className="pt-2">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 text-sm font-bold transition-all duration-200 active:scale-[0.98] ${
            open
              ? "border-slate-400 bg-slate-100 text-slate-700"
              : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
          }`}
        >
          <Users size={16} />
          {open ? "保護者向け分析を閉じる" : "保護者向け分析を見る"}
          <ChevronDown
            size={16}
            className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {open && (
        <div className="space-y-4 animate-scale-in">
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-slate-500 py-4">
              <Loader2 size={16} className="animate-spin" /> 読み込み中...
            </div>
          )}
          {isError && <p className="text-sm text-red-500">取得に失敗しました</p>}
          {data && <ParentBody data={data} />}
        </div>
      )}
    </>
  );
}

// ── 表示専用：data を分解して描く（markupは裸の名前のまま使える） ──
function ParentBody({ data }: { data: ParentData }) {
  const { parent, grammarNotes, kanjiNotes, scores } = data;

  return (
    <>
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
            <p className="text-lg font-bold text-brand-dark">
              {parent.issueBreakdown.shownToChild}
            </p>
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
            {grammarNotes.map((note) => (
              <li key={note.original} className="text-xs text-slate-700 leading-relaxed">
                {note.suggestion ? (
                  <div className="bg-white/60 rounded-xl px-3 py-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="line-through opacity-50 bg-slate-200 px-1.5 py-0.5 rounded">
                        {note.original}
                      </span>
                      <ChevronRight
                        size={14}
                        strokeWidth={2.5}
                        className="text-slate-400 flex-shrink-0"
                      />
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
            {kanjiNotes.map((s) => (
              <li key={s} className="text-xs text-slate-700 leading-relaxed flex gap-2">
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
    </>
  );
}
