"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { type EssayFeedback, type EssaySubmit, EssaySubmitSchema } from "@sakubun-zemi/schemas";
import { useState } from "react";
import { useForm } from "react-hook-form";

const CHAR_MIN = 50;
const CHAR_MAX = 800;

export default function EssayForm() {
  const [feedback, setFeedback] = useState<EssayFeedback | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<EssaySubmit>({
    resolver: zodResolver(EssaySubmitSchema),
  });

  const text = watch("text") ?? "";
  const charCount = text.length;
  const isOverLimit = charCount > CHAR_MAX;
  const charPercent = Math.min((charCount / CHAR_MAX) * 100, 100);

  const onSubmit = async (data: EssaySubmit) => {
    setSubmitting(true);
    setApiError(null);
    setFeedback(null);
    try {
      const res = await fetch("http://localhost:3001/essays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(`サーバーエラー: ${res.status}`);
      const json = await res.json();
      setFeedback(json.feedback);
    } catch (e) {
      setApiError(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6" style={{ color: "var(--color-brand-800)" }}>
        さくぶんを書こう
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* テーマ */}
        <div>
          <label
            htmlFor="theme"
            className="block text-sm font-medium mb-1"
            style={{ color: "var(--color-brand-800)" }}
          >
            テーマ <span className="text-red-500">*</span>
          </label>
          <input
            id="theme"
            type="text"
            placeholder="例：わたしの好きなもの"
            {...register("theme")}
            className="w-full px-4 py-2 border rounded-xl text-base"
            style={{
              borderColor: errors.theme ? "#ef4444" : "var(--color-brand-200)",
              borderRadius: "var(--radius-xl)",
              boxShadow: "var(--shadow-soft)",
            }}
          />
          {errors.theme && <p className="mt-1 text-sm text-red-500">{errors.theme.message}</p>}
        </div>

        {/* 本文 */}
        <div>
          <label
            htmlFor="text"
            className="block text-sm font-medium mb-1"
            style={{ color: "var(--color-brand-800)" }}
          >
            作文 <span className="text-red-500">*</span>
          </label>
          <textarea
            id="text"
            rows={10}
            placeholder={`${CHAR_MIN}〜${CHAR_MAX}文字で書いてね`}
            {...register("text")}
            className="w-full px-4 py-3 border text-base resize-none"
            style={{
              borderColor: errors.text || isOverLimit ? "#ef4444" : "var(--color-brand-200)",
              borderRadius: "var(--radius-xl)",
              boxShadow: "var(--shadow-soft)",
            }}
          />

          {/* 文字数バー */}
          <div className="mt-2 flex items-center gap-3">
            <div className="flex-1 h-1.5 rounded-full bg-gray-200 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${charPercent}%`,
                  backgroundColor: isOverLimit
                    ? "#ef4444"
                    : charCount >= CHAR_MIN
                      ? "var(--color-brand-500)"
                      : "var(--color-accent-500)",
                }}
              />
            </div>
            <span
              className="text-sm tabular-nums"
              style={{
                color: isOverLimit ? "#ef4444" : "var(--color-brand-600)",
              }}
            >
              {charCount} / {CHAR_MAX}字
            </span>
          </div>

          {errors.text && <p className="mt-1 text-sm text-red-500">{errors.text.message}</p>}
        </div>

        {/* 送信ボタン */}
        <button
          type="submit"
          disabled={submitting || isOverLimit}
          className="w-full py-3 rounded-2xl text-base font-bold text-white transition-all duration-200 disabled:opacity-50"
          style={{
            backgroundColor: "var(--color-brand-500)",
            boxShadow: "var(--shadow-brand)",
            borderRadius: "var(--radius-2xl)",
          }}
        >
          {submitting ? "送信中…" : "添削してもらう"}
        </button>

        {apiError && <p className="text-sm text-red-500 text-center">{apiError}</p>}
      </form>

      {/* 結果表示 */}
      {feedback && (
        <div
          className="mt-8 p-6 rounded-2xl"
          style={{
            background: "white",
            boxShadow: "var(--shadow-soft-lg)",
            borderRadius: "var(--radius-2xl)",
          }}
        >
          <h2 className="text-lg font-bold mb-4" style={{ color: "var(--color-brand-800)" }}>
            添削結果
          </h2>

          {/* スコア */}
          <div className="flex items-center gap-4 mb-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white"
              style={{ backgroundColor: "var(--color-brand-500)" }}
            >
              {feedback.overallScore}
            </div>
            <span className="text-sm" style={{ color: "var(--color-brand-600)" }}>
              / 100点
            </span>
          </div>

          {/* コメント */}
          <ul className="space-y-2">
            {feedback.comments.map((comment) => (
              <li
                key={comment}
                className="flex gap-2 text-sm"
                style={{ color: "var(--color-brand-800)" }}
              >
                <span style={{ color: "var(--color-accent-500)" }}>●</span>
                {comment}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
