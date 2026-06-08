import type { HistoryItem } from "@sakubun-zemi/schemas";
import { Award, BookOpen, ChevronRight, Dumbbell, Star } from "lucide-react";
import Link from "next/link";
import { getHistory } from "@/lib/api/history";

// ────────────────────────────────────────────────────────────
// Domain helpers (v1踏襲)
// ────────────────────────────────────────────────────────────

const scoreColor = (score: number) => {
  if (score >= 80) return "text-brand-dark font-bold";
  if (score >= 60) return "text-amber-700 font-bold";
  return "text-red-600 font-bold";
};

const ScoreIcon = ({ score }: { score: number }) => {
  if (score >= 80) return <Star size={18} className="text-brand" />;
  if (score >= 60) return <Award size={18} className="text-amber-500" />;
  if (score >= 40) return <BookOpen size={18} className="text-blue-500" />;
  return <Dumbbell size={18} className="text-red-400" />;
};

const categoryConfig: Record<string, string> = {
  テーマ作文: "bg-brand-light text-brand-dark ring-1 ring-brand-200",
  いけん作文: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
};

function formatDate(isoStr: string): string {
  return new Date(isoStr).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    timeZone: "Asia/Tokyo",
  });
}

// ────────────────────────────────────────────────────────────
// Main page
// ────────────────────────────────────────────────────────────

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const data = await getHistory(); // ★サーバーで取得
  const { totalCount, avgScore, items } = data;

  const avgScoreDisplay = avgScore !== null ? avgScore.toFixed(1) : "--";

  return (
    <div className="animate-fade-in">
      {/* Paper white header area */}
      <div className="px-5 pt-4 pb-5" style={{ background: "#fffdf8" }}>
        <h1 className="text-xl font-bold tracking-tight mb-1" style={{ color: "#2f6e59" }}>
          添削履歴
        </h1>
        <p className="text-xs mb-5" style={{ color: "#7a8a82" }}>
          これまでの添削記録
        </p>

        {/* Stats */}
        <div className="flex gap-3">
          <div className="flex-1 bg-white/95 rounded-2xl px-4 py-3.5 border border-white/30">
            <p className="text-[10px] font-medium" style={{ color: "#7a8a82" }}>
              添削回数
            </p>
            <p className="text-2xl font-extrabold tabular-nums mt-0.5" style={{ color: "#1a3d32" }}>
              {totalCount}
              <span className="text-sm font-normal ml-0.5" style={{ color: "#7a8a82" }}>
                件
              </span>
            </p>
          </div>
          <div className="flex-1 bg-white/95 rounded-2xl px-4 py-3.5 border border-white/30">
            <p className="text-[10px] font-medium" style={{ color: "#7a8a82" }}>
              平均スコア
            </p>
            <p className="text-2xl font-extrabold tabular-nums mt-0.5" style={{ color: "#1a3d32" }}>
              {avgScoreDisplay}
              <span className="text-sm font-normal ml-0.5" style={{ color: "#7a8a82" }}>
                / 100
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* List on green texture */}
      <div className="px-5 pt-4 pb-4">
        {items.length === 0 ? (
          <div className="text-center py-12 bg-white/95 rounded-2xl">
            <div className="text-4xl mb-3">-</div>
            <p className="text-sm mb-2" style={{ color: "#7a8a82" }}>
              まだ添削がありません
            </p>
            <Link
              href="/compose"
              className="inline-flex items-center gap-1 text-sm font-semibold hover:underline"
              style={{ color: "#2f6e59" }}
            >
              作文を書いてみよう
              <ChevronRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="space-y-2.5">
            {items.map((item: HistoryItem, i: number) => {
              const score = item.score;
              const date = formatDate(item.createdAt);
              return (
                <Link
                  key={item.id}
                  href={`/submissions/${item.id}`}
                  className={`flex items-center gap-3 p-4 bg-white/95 rounded-2xl border border-white/30 card-hover animate-slide-up stagger-${Math.min(i + 1, 6)}`}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "#e8f0ea" }}
                  >
                    <ScoreIcon score={score} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: "#1a3d32" }}>
                      {item.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs" style={{ color: "#7a8a82" }}>
                        {date}
                      </span>
                      {item.category ? (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                            categoryConfig[item.category] ??
                            "bg-gray-50 text-gray-600 ring-1 ring-gray-200"
                          }`}
                        >
                          {item.category}
                        </span>
                      ) : (
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                          style={{ background: "#fff2b8", color: "#5a4a00" }}
                        >
                          自由作文
                        </span>
                      )}
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm tabular-nums flex-shrink-0 ${scoreColor(score)}`}
                    style={{ background: "#fff2b8" }}
                  >
                    {score}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
