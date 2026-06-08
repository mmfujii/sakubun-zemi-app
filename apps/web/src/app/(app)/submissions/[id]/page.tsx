import {
  Award,
  BookOpen,
  ChevronLeft,
  Dumbbell,
  FileText,
  Lightbulb,
  Sparkles,
  Star,
  Target,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import Genkouyoushi from "@/components/Genkouyoushi";
import { getSubmission } from "@/lib/api/submission";
import ParentAnalysis from "./ParentAnalysis";

// ── helper（スコアカード用。barColor / scoreItems は ParentAnalysis に移動済み） ──
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

// ── 表示（Server Component）。child まではここで描き、保護者は ParentAnalysis に委譲 ──
function ResultContent({ data }: { data: SubmissionSummary }) {
  const { score, child } = data;

  return (
    <div className="animate-fade-in">
      {/* Header（戻るは Link＝Serverで動く） */}
      <div
        className="px-5 pt-4 pb-3 flex items-center gap-3 sticky top-0 z-10"
        style={{ background: "rgba(255,253,248,0.9)", backdropFilter: "blur(8px)" }}
      >
        <Link
          href="/history"
          className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
          style={{ background: "#e8f0ea" }}
        >
          <ChevronLeft size={16} strokeWidth={2.5} color="#2f6e59" />
        </Link>
        <h1 className="text-base font-bold" style={{ color: "#2f6e59" }}>
          添削結果
        </h1>
      </div>

      <div className="px-5 py-5">
        <div className="bg-white rounded-3xl shadow-soft-lg border border-gray-100 overflow-hidden">
          {/* Score card */}
          <div
            className="p-6 text-center animate-slide-up relative overflow-hidden"
            style={{
              background: "#f4d944 url(/yellow-texture.png)",
              backgroundSize: "400px 400px",
            }}
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
                {child.praise.map((s) => (
                  <li key={s} className="text-sm text-emerald-800 leading-relaxed flex gap-2">
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
                {child.focusPoints.map((fp) => (
                  <li key={fp.point} className="bg-white/60 rounded-xl px-3 py-3">
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

            {/* 保護者分析：クリックで /parent を取得する Client島（先読みしない） */}
            <ParentAnalysis submissionId={data.id} />
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

// ── Page（Server Component） ──
export const dynamic = "force-dynamic";

export default async function SubmissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  try {
    const data = await getSubmission(id); // サーバーで取得
    return <ResultContent data={data} />;
  } catch {
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
}
