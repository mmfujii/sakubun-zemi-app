"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Pen, BookOpen, Clock, ChevronRight } from "lucide-react";
import { getDashboard } from "@/lib/api/dashboard";
import type { DashboardSummary } from "@sakubun-zemi/schemas";

// ────────────────────────────────────────────────────────────
// Domain helpers (v1 ロジック踏襲)
// ────────────────────────────────────────────────────────────

function getTrendMessage(scoreTrend: DashboardSummary["scoreTrend"]): string {
  if (!scoreTrend) return "さくぶんを書いてみよう！";
  return scoreTrend.diff >= 0 ? "着実にのびています" : "もう少しがんばろう！";
}

function getTrendLabel(scoreTrend: DashboardSummary["scoreTrend"]): string | null {
  if (!scoreTrend) return null;
  return scoreTrend.diff >= 0
    ? `+${scoreTrend.diff.toFixed(1)}`
    : scoreTrend.diff.toFixed(1);
}

function getCategoryTag(score: number): string | null {
  if (score >= 80) return "表現力アップ";
  if (score >= 60) return "着実に成長中";
  return null;
}

function formatDate(isoStr: string): string {
  return new Date(isoStr).toLocaleDateString("ja-JP", {
    month: "numeric",
    day: "numeric",
  });
}

// ────────────────────────────────────────────────────────────
// Skeleton（isLoading 中表示）
// ────────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="animate-fade-in" style={{ background: "#5fa488 url(/green-texture.png)", backgroundSize: "400px 400px" }}>
      <div
        className="relative"
        style={{
          background:
            "linear-gradient(to bottom, #fffdf8 0px, #fffdf8 230px, transparent 230px, transparent 100%)",
        }}
      >
        <div className="px-7 pt-3 pb-3 space-y-2">
          <div className="skeleton h-4 w-32" />
          <div className="skeleton h-5 w-48" />
        </div>
        <div className="mx-6">
          <div className="skeleton-brand rounded-[22px] h-36" />
        </div>
        <div className="px-6 pt-4 pb-32 space-y-4">
          <div className="skeleton rounded-[22px] h-24" />
          <div className="skeleton rounded-[22px] h-24" />
          <div className="skeleton rounded-[22px] h-24" />
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Main page
// ────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboard,
  });

  if (isLoading) return <DashboardSkeleton />;
  if (isError || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-white font-semibold">データの取得に失敗しました。</p>
      </div>
    );
  }

  const { userName, totalCount, avgScore, scoreTrend, recentSubmissions } = data;

  const trendLabel = getTrendLabel(scoreTrend);
  const trendMessage = getTrendMessage(scoreTrend);

  const avgScoreDisplay =
    avgScore !== null ? avgScore.toFixed(1) : "--";

  const welcomeMessage =
    totalCount === 0
      ? "今日も1つ、書いてみよう"
      : recentSubmissions.length > 0 && recentSubmissions[0].score >= 70
        ? "前回よくできたね！続けて書いてみよう"
        : "今日も1つ、書いてみよう";

  return (
    <div
      className="animate-fade-in"
      style={{
        background: "#5fa488 url(/green-texture.png)",
        backgroundSize: "400px 400px",
      }}
    >
      {/* Split background: paper top → green bottom */}
      <div
        className="relative"
        style={{
          background:
            "linear-gradient(to bottom, #fffdf8 0px, #fffdf8 230px, transparent 230px, transparent 100%)",
        }}
      >
        {/* ===== Welcome ===== */}
        <div className="px-7 pt-3 pb-3">
          <p className="text-[16px] font-medium" style={{ color: "#5f6f69" }}>
            ようこそ {userName}さん
          </p>
          <p
            className="text-[17px] leading-relaxed mt-1"
            style={{ color: "#213d37" }}
          >
            {welcomeMessage}
          </p>
        </div>

        {/* ===== 成績サマリー (yellow, compact) ===== */}
        <div className="mx-6 relative z-10">
          <div
            className="rounded-[22px] px-5 pt-5 pb-4 animate-slide-up relative overflow-hidden"
            style={{
              background: "#f4d944 url(/yellow-texture.png)",
              backgroundSize: "400px 400px",
            }}
          >
            {/* Decorative circles */}
            <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-white/[0.18]" />
            <div className="absolute -bottom-6 -left-6 w-[76px] h-[76px] rounded-full bg-white/[0.18]" />

            <p
              className="text-[14px] font-extrabold relative mb-4"
              style={{ color: "#17483e" }}
            >
              成績サマリー
            </p>

            <div className="grid grid-cols-[1fr_1px_1fr] gap-4 items-center relative">
              <div>
                <p
                  className="text-[13px] mb-1.5"
                  style={{ color: "rgba(23,72,62,0.75)" }}
                >
                  添削回数
                </p>
                <div className="flex items-baseline gap-1">
                  <span
                    className="text-[32px] leading-none font-black tabular-nums"
                    style={{ color: "#0f4b3f" }}
                  >
                    {totalCount}
                  </span>
                  <span
                    className="text-[14px] font-extrabold"
                    style={{ color: "#0f4b3f" }}
                  >
                    回
                  </span>
                </div>
              </div>
              <div
                className="w-px h-[56px]"
                style={{ background: "rgba(23,72,62,0.15)" }}
              />
              <div>
                <p
                  className="text-[13px] mb-1.5"
                  style={{ color: "rgba(23,72,62,0.75)" }}
                >
                  平均スコア
                </p>
                <div className="flex items-baseline gap-1">
                  <span
                    className="text-[30px] leading-none font-black tabular-nums"
                    style={{ color: "#0f4b3f" }}
                  >
                    {avgScoreDisplay}
                  </span>
                  <span
                    className="text-[13px] font-extrabold"
                    style={{ color: "#0f4b3f" }}
                  >
                    /100
                  </span>
                </div>
              </div>
            </div>

            {/* Trend pill */}
            <div
              className="mt-4 rounded-full px-4 py-3 flex items-center justify-between relative"
              style={{ background: "rgba(255,255,255,0.38)" }}
            >
              <span
                className="text-[13px] font-bold flex items-center gap-1"
                style={{ color: "#18483d" }}
              >
                <span>✦</span>
                {trendLabel && <>{trendLabel}点</>}
                {"　"}{trendMessage}
              </span>
            </div>
          </div>
        </div>

        {/* ===== Actions + Recent (on green bg) ===== */}
        <div className="px-6 pt-4 pb-32 relative z-10">
          {/* 3-column action card */}
          <div className="rounded-[22px] bg-white/95 overflow-hidden animate-slide-up stagger-1">
            <div
              className="grid grid-cols-3 divide-x"
              style={{ borderColor: "rgba(33,71,58,0.1)" }}
            >
              <Link
                href="/compose"
                className="px-2 py-4 text-center card-hover block"
              >
                <div
                  className="w-[56px] h-[42px] mx-auto mb-3 rounded-full flex items-center justify-center"
                  style={{ background: "#f7e689" }}
                >
                  <Pen size={18} color="#2f6e59" strokeWidth={2} />
                </div>
                <p
                  className="text-[13px] font-extrabold mb-1"
                  style={{ color: "#163e34" }}
                >
                  自由作文を書く
                </p>
                <p className="text-[11px] leading-snug" style={{ color: "#5f6f69" }}>
                  好きなテーマで
                </p>
              </Link>
              <Link
                href="/prompts"
                className="px-2 py-4 text-center card-hover block"
              >
                <div
                  className="w-[56px] h-[42px] mx-auto mb-3 rounded-full flex items-center justify-center"
                  style={{ background: "#dce8de" }}
                >
                  <BookOpen size={18} color="#2f6e59" strokeWidth={1.8} />
                </div>
                <p
                  className="text-[13px] font-extrabold mb-1"
                  style={{ color: "#163e34" }}
                >
                  お題を選ぶ
                </p>
                <p className="text-[11px] leading-snug" style={{ color: "#5f6f69" }}>
                  問題一覧から選べるよ
                </p>
              </Link>
              <Link
                href="/history"
                className="px-2 py-4 text-center card-hover block"
              >
                <div
                  className="w-[56px] h-[42px] mx-auto mb-3 rounded-full flex items-center justify-center"
                  style={{ background: "#e7efe9" }}
                >
                  <Clock size={18} color="#2f6e59" strokeWidth={1.8} />
                </div>
                <p
                  className="text-[13px] font-extrabold mb-1"
                  style={{ color: "#163e34" }}
                >
                  履歴を見る
                </p>
                <p className="text-[11px] leading-snug" style={{ color: "#5f6f69" }}>
                  これまでの記録を見よう
                </p>
              </Link>
            </div>
          </div>

          {/* 最近の添削 */}
          <div className="flex items-center justify-between mt-6 mb-3 px-0.5">
            <h2 className="text-[18px] font-black tracking-tight text-white">
              最近の添削
            </h2>
            {recentSubmissions.length > 0 && (
              <Link
                href="/history"
                className="text-[13px] font-extrabold hover:underline"
                style={{ color: "#f7e384" }}
              >
                すべて見る &gt;
              </Link>
            )}
          </div>

          {recentSubmissions.length === 0 ? (
            <div className="text-center py-10 bg-white/[0.97] rounded-[22px]">
              <p className="text-sm text-gray-500 mb-2">
                まだ添削がありません
              </p>
              <Link
                href="/compose"
                className="inline-flex items-center gap-1 text-brand-dark text-sm font-semibold hover:underline"
              >
                作文を書いてみる <ChevronRight size={14} />
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentSubmissions.map((submission: DashboardSummary["recentSubmissions"][number], i: number) => {
                const tag = getCategoryTag(submission.score);
                const date = formatDate(submission.createdAt);
                return (
                  <Link
                    key={submission.id}
                    href={`/submissions/${submission.id}`}
                    className={`block bg-white/[0.97] rounded-[22px] p-5 card-hover animate-slide-up stagger-${i + 1}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-[15px] font-extrabold leading-snug"
                          style={{ color: "#1b2f2b" }}
                        >
                          {submission.title}
                        </p>
                        <p
                          className="text-[13px] mt-1.5"
                          style={{ color: "#96a39f" }}
                        >
                          {date}
                        </p>
                      </div>
                      <span
                        className="min-w-[48px] h-9 px-2.5 rounded-full flex items-center justify-center text-[16px] font-black tabular-nums"
                        style={{ background: "#fff2b8", color: "#b57a00" }}
                      >
                        {submission.score}
                      </span>
                    </div>
                    {tag && (
                      <div className="mt-3">
                        <span
                          className="inline-flex items-center px-4 py-2 rounded-full text-[13px] font-extrabold"
                          style={{ background: "#f9eb97", color: "#315848" }}
                        >
                          {tag}
                        </span>
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
