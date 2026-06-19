// 作文入力フォーム（自由作文＝prompt無し / お題＝prompt有り の両対応）。
// 提出すると Hono /essays が Claude で添削し、結果をDB保存。成功で /submissions/[id] へ遷移。
//
// V1 から移植中（コミット単位で順次。V2方針: 画像は保存しない／content-safety・child_profileは別フェーズ）:
//   - [済] 写真OCR（写真→/ocr→本文）
//   - [この回] タイトル / 目標字数UI / 入力方法トグル（キーボード/写真）
//   - [予定] 写真フロー強化（複数枚プレビュー）, 目標字数の添削反映, 音声入力, Undo/Redo, 下書き保存

"use client";

import type { Prompt } from "@sakubun-zemi/schemas";
import { EssaySubmitSchema } from "@sakubun-zemi/schemas";
import {
  ChevronLeft,
  Grid3x3,
  Info,
  Loader2,
  Mic,
  MicOff,
  RotateCcw,
  RotateCw,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import Genkouyoushi from "@/components/Genkouyoushi";
import ImageUploader from "@/components/ImageUploader";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import { createClient } from "@/lib/supabase/client";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

const CHAR_MIN = 50;
const CHAR_MAX = 800;
const DRAFT_KEY = "sakubun-zemi-draft-free";

type Props = {
  prompt?: Prompt | null;
};

export default function ComposeForm({ prompt }: Props) {
  const router = useRouter();

  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [targetLengthMin, setTargetLengthMin] = useState("");
  const [targetLengthMax, setTargetLengthMax] = useState("");
  const [inputMode, setInputMode] = useState<"keyboard" | "photo">("keyboard");
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [navigating, setNavigating] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const cursorPosRef = useRef(0);

  // 音声入力（Web Speech API）。確定テキストをカーソル位置に挿入する
  const {
    isListening,
    error: voiceError,
    isSupported: voiceSupported,
    toggle: toggleVoice,
  } = useSpeechRecognition({
    onInterim: useCallback(() => {
      // 暫定テキストは本文に反映しない
    }, []),
    onTranscript: useCallback((transcript: string) => {
      const pos = cursorPosRef.current;
      setText((prev) => {
        const next = prev.slice(0, pos) + transcript + prev.slice(pos);
        cursorPosRef.current = pos + transcript.length;
        return next;
      });
      requestAnimationFrame(() => {
        const ta = textareaRef.current;
        if (ta) {
          ta.focus();
          ta.selectionStart = cursorPosRef.current;
          ta.selectionEnd = cursorPosRef.current;
        }
      });
    }, []),
  });

  const {
    handleChange: handleTextChange,
    setImmediate: setTextImmediate,
    undo,
    redo,
    canUndo,
    canRedo,
    resetHistory,
  } = useUndoRedo(text, setText);

  const hasUnsavedContent = text.trim().length > 0 || title.trim().length > 0;

  // 下書き（自由作文のみ）: 復元（マウント時のみ）
  // biome-ignore lint/correctness/useExhaustiveDependencies: マウント時に一度だけ実行する
  useEffect(() => {
    if (prompt) return;
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (!saved) return;
      const draft = JSON.parse(saved) as {
        title?: string;
        text?: string;
        targetLengthMin?: string;
        targetLengthMax?: string;
      };
      if (draft.title) setTitle(draft.title);
      if (draft.text) setTextImmediate(draft.text);
      if (draft.targetLengthMin) setTargetLengthMin(draft.targetLengthMin);
      if (draft.targetLengthMax) setTargetLengthMax(draft.targetLengthMax);
      if (draft.title || draft.text) setDraftRestored(true);
    } catch {
      // ignore
    }
  }, []);

  // 下書き: 自動保存
  useEffect(() => {
    if (prompt || navigating) return;
    try {
      if (hasUnsavedContent) {
        localStorage.setItem(
          DRAFT_KEY,
          JSON.stringify({ title, text, targetLengthMin, targetLengthMax }),
        );
      } else {
        localStorage.removeItem(DRAFT_KEY);
      }
    } catch {
      // ignore
    }
  }, [prompt, title, text, targetLengthMin, targetLengthMax, hasUnsavedContent, navigating]);

  // 離脱警告（自由作文・未保存内容あり）
  useEffect(() => {
    if (prompt || !hasUnsavedContent || navigating) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [prompt, hasUnsavedContent, navigating]);

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      // ignore
    }
  }, []);

  const discardDraft = () => {
    setTitle("");
    setTextImmediate("");
    setTargetLengthMin("");
    setTargetLengthMax("");
    setDraftRestored(false);
    clearDraft();
    resetHistory();
  };

  const handleBack = () => {
    if (hasUnsavedContent) {
      const ok = window.confirm(
        "入力中の作文があります。下書きは自動保存されていますが、本当に戻りますか？",
      );
      if (!ok) return;
    }
    router.back();
  };

  const charCount = text.length;
  const isOverLimit = charCount > CHAR_MAX;
  const charPercent = Math.min((charCount / CHAR_MAX) * 100, 100);

  // 提出に使うテーマ: お題がある時はそのタイトル、自由作文はタイトル入力（未入力は「無題の作文」）
  const resolvedTheme = prompt ? prompt.title : title.trim() || "無題の作文";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsed = EssaySubmitSchema.safeParse({
      theme: resolvedTheme,
      text,
      promptId: prompt?.id, // お題から書いた場合のみ付く（自由作文ならundefined）
      targetLengthMin: targetLengthMin ? Number.parseInt(targetLengthMin, 10) : undefined,
      targetLengthMax: targetLengthMax ? Number.parseInt(targetLengthMax, 10) : undefined,
    });
    if (!parsed.success) {
      const msgs = parsed.error.errors.map((err) => err.message).join("　");
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
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify(parsed.data),
      });
      if (!res.ok) throw new Error(`サーバーエラー: ${res.status}`);
      const json = await res.json();
      // 添削成功 → 下書きを消して結果画面へ遷移
      clearDraft();
      setNavigating(true);
      router.push(`/submissions/${json.submissionId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen animate-fade-in">
      {/* ─── Sticky header ─── */}
      <div
        className="px-5 pt-4 pb-3 flex items-center gap-3 sticky top-0 z-10"
        style={{ background: "rgba(255,253,248,0.9)", backdropFilter: "blur(8px)" }}
      >
        <button
          type="button"
          onClick={handleBack}
          className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
          style={{ background: "#e8f0ea" }}
          aria-label="戻る"
        >
          <ChevronLeft size={16} strokeWidth={2.5} color="#2f6e59" />
        </button>
        <h1 className="text-base font-bold flex-1" style={{ color: "#2f6e59" }}>
          {prompt ? "作文入力" : "自由作文"}
        </h1>
        {!prompt && hasUnsavedContent && (
          <button
            type="button"
            onClick={() => {
              if (window.confirm("下書きをクリアしますか？")) discardDraft();
            }}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors"
          >
            クリア
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="px-5 py-5 space-y-5">
        {draftRestored && (
          <div className="bg-amber-50 text-amber-700 text-sm px-4 py-3 rounded-xl border border-amber-200 animate-scale-in flex items-center justify-between">
            <p className="text-xs">前回の下書きを復元しました</p>
            <button
              type="button"
              onClick={discardDraft}
              className="text-xs font-bold text-amber-600 underline ml-3 shrink-0"
            >
              破棄する
            </button>
          </div>
        )}
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
            <p className="font-bold text-gray-900 text-sm mb-2 leading-snug">{prompt.title}</p>
            <p className="text-xs text-gray-500 leading-relaxed">{prompt.body}</p>
          </div>
        )}

        {/* ─── タイトル入力 (自由作文時のみ) ─── */}
        {!prompt && (
          <div className="animate-slide-up">
            <label
              htmlFor="title"
              className="text-sm font-bold block mb-2"
              style={{ color: "#fffdf8" }}
            >
              タイトル
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setDraftRestored(false);
              }}
              placeholder="作文のタイトルを入力..."
              maxLength={50}
              className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 bg-white text-sm focus:outline-none focus:border-brand transition-all duration-200"
            />
            <p className="text-xs mt-1 text-right" style={{ color: "rgba(255,253,248,0.6)" }}>
              {title.length}/50
            </p>
          </div>
        )}

        {/* ─── 目標字数 (自由作文時のみ・任意) ─── */}
        {!prompt && (
          <div className="animate-slide-up">
            <span className="text-sm font-bold block mb-2" style={{ color: "#fffdf8" }}>
              目標字数
              <span className="text-xs font-normal ml-2" style={{ color: "rgba(255,253,248,0.6)" }}>
                任意
              </span>
            </span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={targetLengthMin}
                onChange={(e) => setTargetLengthMin(e.target.value)}
                placeholder="例: 200"
                min={20}
                max={800}
                className="w-24 px-3 py-3 rounded-2xl border-2 border-gray-200 bg-white text-sm text-center focus:outline-none focus:border-brand transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="text-sm" style={{ color: "rgba(255,253,248,0.7)" }}>
                〜
              </span>
              <input
                type="number"
                value={targetLengthMax}
                onChange={(e) => setTargetLengthMax(e.target.value)}
                placeholder="例: 400"
                min={20}
                max={800}
                className="w-24 px-3 py-3 rounded-2xl border-2 border-gray-200 bg-white text-sm text-center focus:outline-none focus:border-brand transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="text-sm" style={{ color: "rgba(255,253,248,0.7)" }}>
                字
              </span>
            </div>
            <p className="text-xs mt-1" style={{ color: "rgba(255,253,248,0.6)" }}>
              入力すると字数に合わせた添削になります
            </p>
          </div>
        )}

        {/* ─── 入力方法トグル ─── */}
        <div className="flex gap-2 animate-slide-up stagger-1">
          <button
            type="button"
            onClick={() => setInputMode("keyboard")}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${
              inputMode === "keyboard"
                ? "bg-brand text-white"
                : "bg-white/20 text-white/80 hover:bg-white/30"
            }`}
          >
            キーボードで入力
          </button>
          <button
            type="button"
            onClick={() => setInputMode("photo")}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${
              inputMode === "photo"
                ? "bg-brand text-white"
                : "bg-white/20 text-white/80 hover:bg-white/30"
            }`}
          >
            写真で送る
          </button>
        </div>

        {/* ─── キーボード入力 ─── */}
        {inputMode === "keyboard" && (
          <div className="animate-slide-up stagger-1">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <label htmlFor="essay" className="text-sm font-bold" style={{ color: "#fffdf8" }}>
                  作文を入力
                </label>
                {voiceSupported && (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={toggleVoice}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90 ${
                        isListening
                          ? "bg-red-500 text-white shadow-md"
                          : "bg-white/20 text-white hover:bg-white/30 shadow-sm"
                      }`}
                      aria-label={isListening ? "音声入力を停止" : "音声入力を開始"}
                    >
                      {isListening ? (
                        <MicOff size={15} strokeWidth={2.5} />
                      ) : (
                        <Mic size={15} strokeWidth={2.5} />
                      )}
                    </button>
                    {isListening && (
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 animate-voice-balloon pointer-events-none">
                        <div className="bg-red-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap shadow-lg flex items-center gap-1.5">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
                          </span>
                          音声入力中
                        </div>
                        <div className="flex justify-center">
                          <div className="w-2 h-2 bg-red-500 rotate-45 -mt-1" />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                {/* Undo / Redo */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={undo}
                    disabled={!canUndo}
                    className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 disabled:opacity-25 disabled:hover:bg-transparent transition-colors"
                    style={{ color: "rgba(255,253,248,0.6)" }}
                    aria-label="元に戻す"
                  >
                    <RotateCcw size={14} strokeWidth={2.5} />
                  </button>
                  <button
                    type="button"
                    onClick={redo}
                    disabled={!canRedo}
                    className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 disabled:opacity-25 disabled:hover:bg-transparent transition-colors"
                    style={{ color: "rgba(255,253,248,0.6)" }}
                    aria-label="やり直す"
                  >
                    <RotateCw size={14} strokeWidth={2.5} />
                  </button>
                </div>
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
                      charCount > 0 && !isOverLimit ? { color: "rgba(255,253,248,0.8)" } : undefined
                    }
                  >
                    {charCount}
                  </span>
                  <span className="mx-0.5">/</span>
                  {CHAR_MAX}
                </span>
              </div>
            </div>

            {voiceError && (
              <div className="bg-red-50 text-red-600 text-xs px-3 py-2 rounded-xl border border-red-100 mb-2 animate-scale-in">
                {voiceError}
              </div>
            )}

            <textarea
              ref={textareaRef}
              id="essay"
              value={text}
              onChange={(e) => {
                handleTextChange(e.target.value);
                setDraftRestored(false);
              }}
              onSelect={(e) => {
                cursorPosRef.current = (e.target as HTMLTextAreaElement).selectionStart;
              }}
              placeholder={
                prompt
                  ? "ここに作文を入力してください..."
                  : "自由にテーマを決めて作文を書いてみましょう..."
              }
              className={`w-full h-60 px-4 py-4 rounded-2xl border-2 bg-white text-sm leading-[1.8] resize-none transition-all duration-200 focus:outline-none focus:ring-0 ${
                isListening
                  ? "border-red-300 focus:border-red-400"
                  : isOverLimit
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
        )}

        {/* ─── 写真で送る（OCR・ImageUploader） ─── */}
        {inputMode === "photo" && (
          <div className="animate-slide-up stagger-1">
            <ImageUploader
              onTextExtracted={(t) => {
                setTextImmediate(t);
                setInputMode("keyboard");
              }}
              onSwitchToKeyboard={() => setInputMode("keyboard")}
            />
          </div>
        )}

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
