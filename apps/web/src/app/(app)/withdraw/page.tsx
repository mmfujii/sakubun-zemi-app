// 退会（アカウント削除）の確認ページ。POST /account/delete → サインアウト → ログインへ。
"use client";

import { AlertTriangle, ChevronLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export default function WithdrawPage() {
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch(`${API_BASE}/account/delete`, {
        method: "POST",
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "退会に失敗しました");
      }
      // セッションを破棄してログイン画面へ
      await supabase.auth.signOut();
      router.push("/login");
    } catch (e) {
      setError(e instanceof Error ? e.message : "退会に失敗しました");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen animate-fade-in">
      {/* Header */}
      <div
        className="px-5 pt-4 pb-3 flex items-center gap-3 sticky top-0 z-10"
        style={{ background: "rgba(255,253,248,0.9)", backdropFilter: "blur(8px)" }}
      >
        <Link
          href="/mypage"
          className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
          style={{ background: "#e8f0ea" }}
          aria-label="戻る"
        >
          <ChevronLeft size={16} color="#2f6e59" />
        </Link>
        <h1 className="text-base font-bold" style={{ color: "#2f6e59" }}>
          退会について
        </h1>
      </div>

      <div className="px-5 py-6 space-y-5">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 animate-slide-up">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center">
              <AlertTriangle size={18} className="text-red-500" strokeWidth={2} />
            </div>
            <h2 className="font-bold text-gray-900">退会するとどうなりますか？</h2>
          </div>
          <ul className="text-sm text-gray-600 leading-relaxed space-y-2 list-disc list-inside">
            <li>アカウントと、これまでの作文・添削結果がすべて削除されます</li>
            <li>お子さま情報・ご利用プランの情報も削除されます</li>
            <li>有料プランをご利用中の場合、サブスクリプションは解約されます</li>
            <li>削除されたデータは元に戻せません</li>
          </ul>
        </div>

        <label className="flex items-start gap-3 px-1 cursor-pointer">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-red-500"
          />
          <span className="text-sm" style={{ color: "#fffdf8" }}>
            上記を理解し、アカウントとすべてのデータを削除することに同意します
          </span>
        </label>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100 animate-scale-in">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleDelete}
          disabled={!agreed || loading}
          className="w-full py-4 rounded-2xl bg-red-500 text-white font-bold text-base hover:bg-red-600 active:scale-[0.98] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 size={18} strokeWidth={2.5} className="animate-spin" />
              退会処理中...
            </span>
          ) : (
            "退会する（アカウントを削除）"
          )}
        </button>

        <Link
          href="/mypage"
          className="block text-center text-sm font-semibold py-2"
          style={{ color: "rgba(255,253,248,0.8)" }}
        >
          キャンセルして戻る
        </Link>
      </div>
    </div>
  );
}
