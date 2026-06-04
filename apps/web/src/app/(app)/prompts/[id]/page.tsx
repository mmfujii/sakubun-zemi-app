"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { getPrompt } from "@/lib/api/prompts";
import ComposeForm from "@/components/ComposeForm";

function PromptDetailSkeleton() {
  return (
    <div className="animate-fade-in px-5 pt-4 pb-4 space-y-4">
      <div className="flex items-center gap-3">
        <div className="skeleton w-8 h-8 rounded-full" />
        <div className="skeleton h-5 w-24" />
      </div>
      <div className="skeleton rounded-2xl h-28" />
      <div className="skeleton rounded-2xl h-60" />
    </div>
  );
}

export default function PromptDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["prompt", id],
    queryFn: () => getPrompt(id),
  });

  if (isLoading) return <PromptDetailSkeleton />;

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-6 text-center">
        <p className="text-white font-bold text-lg">お題が見つかりません</p>
        <p className="text-sm" style={{ color: "rgba(255,253,248,0.7)" }}>
          このお題は存在しないか、削除された可能性があります。
        </p>
        <Link
          href="/prompts"
          className="mt-2 inline-flex items-center gap-1 px-5 py-2.5 rounded-full text-sm font-bold text-white transition-all active:scale-95"
          style={{ background: "rgba(255,253,248,0.2)", border: "1px solid rgba(255,253,248,0.3)" }}
        >
          お題一覧に戻る
        </Link>
      </div>
    );
  }

  return <ComposeForm prompt={data} />;
}
