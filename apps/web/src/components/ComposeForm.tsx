// 提出すると Hono /essays が Claude で添削し、結果をDB保存。
// 成功すると /submissions/[id] へ遷移して結果を表示する。
//
// 意図的に除外した機能（後フェーズで実装予定）:
//   - 音声入力（useSpeechRecognition）
//   - 写真/OCR（ImageUploader / ImagePreviewModal）
//   - Undo/Redo（useUndoRedo）
//   - 下書きlocalStorage保存・復元
//   - 目標字数（targetLengthMin/Max）
//   - quota / UpgradeWall
//   - content-safety チェック

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Info, Grid3x3, Loader2 } from "lucide-react";
import { EssaySubmitSchema } from "@sakubun-zemi/schemas";
import type { Prompt } from "@sakubun-zemi/schemas";
import Genkouyoushi from "@/components/Genkouyoushi";
import { createClient } from "@/lib/supabase/client";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

const CHAR_MIN = 50;
const CHAR_MAX = 800;

type Props = {
  prompt?: Prompt | null;
};

export default function ComposeForm({ prompt }: Props) {
  const router = useRouter();

  const [text, setText] = useState("");
  const [themeInput, setThemeInput] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const charCount = text.length;
  const isOverLimit = charCount > CHAR_MAX;
  const charPercent = Math.min((charCount / CHAR_MAX) * 100, 100);

  // 提出に使うテーマ: お題がある時はそのタイトル、ない時は手入力
  const resolvedTheme = prompt ? prompt.title : themeInput;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsed = EssaySubmitSchema.safeParse({
      theme: resolvedTheme,
      text,
      promptId: prompt?.id, // お題から書いた場合のみ付く（自由作文ならundefined）
    });
    if (!parsed.success) {
      const msgs = parsed.error.errors.map((e) => e.message).join("　");
      setError(msgs);
      return;
    }

    setLoading(true);
    try {
      // ブラウザのSupabaseセッションからアクセストークンを取得して付与
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const res = await fetch(`${API_BASE}/essays`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token
            ? { Authorization: `Bearer ${session.access_token}` }
            : {}),
        },
        body: JSON.stringify(parsed.data),
      });
      if (!res.ok) throw new Error(`サーバーエラー: ${res.status}`);
      const json = await res.json();
      // 添削成功 → 結果画面へ遷移（loadingはそのまま＝画面が変わるまで提出中表示）
      router.push(`/submissions/${json.submissionId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen animate-fade-in">
      {/* ─── Sticky header (v1スタイル) ─── */}
      <div
        className="px-5 pt-4 pb-3 flex items-center gap-3 sticky top-0 z-10"
        style={{ background: "rgba(255,253,248,0.9)", backdropFilter: "blur(8px)" }}
      >
        <button
          type="button"
          onClick={() => router.back()}
          className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
          style={{ background: "#e8f0ea" }}
          aria-label="戻る"
        >
          <ChevronLeft size={16} strokeWidth={2.5} color="#2f6e59" />
        </button>
        <h1 className="text-base font-bold flex-1" style={{ color: "#2f6e59" }}>
          作文入力
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="px-5 py-5 space-y-5">
        {/* ─── お題カード (promptがある時のみ) ─── */}
        {prompt && (
          <div className="bg-white/95 rounded-2xl p-4 border border-white/30 animate-slide-up">
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ background: "#dce8de" }}
              >
                <Info size={12} stroke="#2f6e59" strokeWidth={2.5} />
              </div>
              <p className="text-xs font-bold" style={{ color: "#2f6e59" }}>
                問題文
              </p>
            </div>
            <p className="font-bold text-gray-900 text-sm mb-2 leading-snug">
              {prompt.title}
            </p>
            <p className="text-xs text-gray-500 leading-relaxed">{prompt.body}</p>
          </div>
        )}

        {/* ─── テーマ入力 (自由作文時のみ表示) ─── */}
        {!prompt && (
          <div className="animate-slide-up">
            <label
              htmlFor="theme"
              className="text-sm font-bold block mb-2"
              style={{ color: "#fffdf8" }}
            >
              テーマ
              <span className="text-xs font-normal ml-1" style={{ color: "rgba(255,253,248,0.7)" }}>
                必須
              </span>
            </label>
            <input
              id="theme"
              type="text"
              value={themeInput}
              onChange={(e) => setThemeInput(e.target.value)}
              placeholder="例：わたしの好きなもの"
              className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 bg-white text-sm focus:outline-none focus:border-brand transition-all duration-200"
            />
          </div>
        )}

        {/* ─── 作文 textarea + 文字数バー ─── */}
        <div className="animate-slide-up stagger-1">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-bold" style={{ color: "#fffdf8" }}>
              作文を入力
            </label>
            <div className="flex items-center gap-3">
              {/* 文字数バー */}
              <div
                className="w-16 h-1.5 rounded-full overflow-hidden"
                style={{ background: "rgba(255,255,255,0.2)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${charPercent}%`,
                    backgroundColor: isOverLimit
                      ? "#ef4444"
                      : charCount >= CHAR_MIN
                        ? "var(--color-brand-500, #2f6e59)"
                        : "var(--color-accent-500, #f4d944)",
                  }}
                />
              </div>
              <span
                className={`text-xs tabular-nums ${isOverLimit ? "text-red-500 font-bold" : ""}`}
                style={isOverLimit ? undefined : { color: "rgba(255,253,248,0.5)" }}
              >
                <span
                  className="font-semibold"
                  style={
                    charCount > 0 && !isOverLimit
                      ? { color: "rgba(255,253,248,0.8)" }
                      : undefined
                  }
                >
                  {charCount}
                </span>
                <span className="mx-0.5">/</span>
                {CHAR_MAX}
              </span>
            </div>
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="ここに作文を入力してください..."
            className={`w-full h-60 px-4 py-4 rounded-2xl border-2 bg-white text-sm leading-[1.8] resize-none transition-all duration-200 focus:outline-none focus:ring-0 ${
              isOverLimit
                ? "border-red-300 focus:border-red-400"
                : "border-gray-200 focus:border-brand"
            }`}
          />

          {isOverLimit && (
            <p className="text-red-500 text-xs mt-1 font-medium animate-scale-in">
              {CHAR_MAX}文字をこえています（{charCount - CHAR_MAX}文字オーバー）
            </p>
          )}

          {charCount > 0 && charCount < CHAR_MIN && (
            <p className="text-xs mt-1" style={{ color: "rgba(255,253,248,0.6)" }}>
              あと{CHAR_MIN - charCount}文字以上書いてね（最低{CHAR_MIN}文字）
            </p>
          )}
        </div>

        {/* ─── 原稿用紙プレビュー toggle ─── */}
        {text.trim().length > 0 && (
          <div className="animate-slide-up stagger-2">
            <button
              type="button"
              onClick={() => setShowPreview((v) => !v)}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 text-sm font-bold transition-all duration-200 active:scale-[0.98] ${
                showPreview
                  ? "border-brand bg-white text-brand-dark"
                  : "border-white/30 bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              <Grid3x3 size={16} />
              {showPreview ? "原稿用紙を閉じる" : "原稿用紙で見る"}
            </button>
            {showPreview && (
              <div className="mt-3 animate-scale-in">
                <Genkouyoushi text={text} compact />
              </div>
            )}
          </div>
        )}

        {/* ─── エラー表示 ─── */}
        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100 animate-scale-in">
            {error}
          </div>
        )}

        {/* ─── 提出ボタン ─── */}
        <button
          type="submit"
          disabled={loading || !text.trim() || isOverLimit}
          className="w-full py-4 rounded-2xl text-white font-bold text-base disabled:opacity-40 active:scale-[0.98] transition-all duration-200 animate-slide-up stagger-3"
          style={{
            background: "rgba(255,253,248,0.2)",
            border: "1px solid rgba(255,253,248,0.3)",
          }}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 size={18} strokeWidth={2.5} className="animate-spin" />
              提出中...
            </span>
          ) : (
            "添削してもらう"
          )}
        </button>
      </form>
    </div>
  );
}
