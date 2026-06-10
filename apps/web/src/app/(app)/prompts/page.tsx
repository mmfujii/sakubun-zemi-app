"use client";

import type { Prompt } from "@sakubun-zemi/schemas";
import { useQuery } from "@tanstack/react-query";
import { FileText, MessageCircle, PenLine } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { getPrompts } from "@/lib/api/prompts";

// ────────────────────────────────────────────────────────────
// Domain config (v1踏襲)
// ────────────────────────────────────────────────────────────

const categoryConfig: Record<string, { bg: string; icon: React.ReactNode }> = {
  テーマ作文: {
    bg: "bg-brand-light text-brand-dark ring-1 ring-brand-200",
    icon: <PenLine size={18} className="text-brand" />,
  },
  いけん作文: {
    bg: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
    icon: <MessageCircle size={18} className="text-blue-600" />,
  },
};

const categories = ["すべて", "テーマ作文", "いけん作文"];

// ────────────────────────────────────────────────────────────
// Skeleton
// ────────────────────────────────────────────────────────────

function PromptsSkeleton() {
  return (
    <div className="animate-fade-in px-5 pt-4 pb-4">
      <div className="mb-5 space-y-1">
        <div className="skeleton h-6 w-32" />
        <div className="skeleton h-4 w-48" />
      </div>
      <div className="flex gap-2 mb-5">
        {categories.map((c) => (
          <div key={c} className="skeleton rounded-full h-9 w-20" />
        ))}
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton rounded-2xl h-20" />
        ))}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Main page
// ────────────────────────────────────────────────────────────

export default function PromptsPage() {
  const [selectedCategory, setSelectedCategory] = useState("すべて");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["prompts"],
    queryFn: getPrompts,
  });

  if (isLoading) return <PromptsSkeleton />;
  if (isError || !data) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-sm font-semibold" style={{ color: "#7a8a82" }}>
          データの取得に失敗しました。
        </p>
      </div>
    );
  }

  const filteredPrompts: Prompt[] =
    selectedCategory === "すべて"
      ? data.prompts
      : data.prompts.filter((p) => p.category === selectedCategory);

  return (
    <div className="animate-fade-in">
      {/* Paper white header area */}
      <div
        style={{
          background: "linear-gradient(to bottom, #fffdf8 0px, #fffdf8 130px, transparent 130px)",
        }}
      >
        <div className="px-5 pt-4 pb-4">
          {/* Header */}
          <div className="mb-5">
            <h1 className="text-xl font-bold tracking-tight" style={{ color: "#2f6e59" }}>
              問題一覧
            </h1>
            <p className="text-xs mt-1" style={{ color: "#7a8a82" }}>
              お題を選んで作文を書こう
            </p>
          </div>

          {/* Category filter */}
          <div className="flex gap-2 mb-5 overflow-x-auto pb-1 -mx-1 px-1">
            {categories.map((cat) => {
              const isActive = cat === selectedCategory;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                    isActive
                      ? "text-white shadow-sm"
                      : "bg-white/90 text-gray-500 ring-1 ring-gray-200 hover:ring-gray-300 hover:text-gray-700"
                  }`}
                  style={isActive ? { background: "#2f6e59" } : undefined}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Prompt list */}
          <div className="space-y-3">
            {filteredPrompts.map((prompt, i) => {
              const config = categoryConfig[prompt.category ?? ""] ?? {
                bg: "bg-gray-50 text-gray-600 ring-1 ring-gray-200",
                icon: <FileText size={18} className="text-gray-500" />,
              };
              return (
                <Link
                  key={prompt.id}
                  href={`/prompts/${prompt.id}`}
                  className={`block bg-white/95 rounded-2xl p-4 border border-white/30 card-hover animate-slide-up stagger-${Math.min(i + 1, 6)}`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: "#e8f0ea" }}
                    >
                      {config.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      {prompt.category && (
                        <span
                          className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mb-1.5 ${config.bg}`}
                        >
                          {prompt.category}
                        </span>
                      )}
                      <p className="font-bold text-sm leading-snug" style={{ color: "#1a3d32" }}>
                        {prompt.title}
                      </p>
                      <p
                        className="text-xs mt-1 line-clamp-2 leading-relaxed"
                        style={{ color: "#7a8a82" }}
                      >
                        {prompt.body}
                      </p>
                    </div>
                    <svg
                      aria-hidden="true"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="flex-shrink-0 mt-1"
                      style={{ color: "#b0c4b8" }}
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </Link>
              );
            })}
          </div>

          {filteredPrompts.length === 0 && (
            <div className="text-center py-12 bg-white/90 rounded-2xl">
              <div className="text-4xl mb-3">-</div>
              <p className="text-sm" style={{ color: "#7a8a82" }}>
                このカテゴリにはまだ問題がありません
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
