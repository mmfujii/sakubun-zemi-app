// マイページ: お子さま情報の編集 ＋ ご利用プラン（残り回数/チケット/アップグレード・解約）。
// GET /profile・GET /quota・PUT /profile・POST /stripe/portal を Supabaseセッションのトークン付きで叩く。
"use client";

import type { Quota } from "@sakubun-zemi/schemas";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { LogoutButton } from "@/components/LogoutButton";
import { createClient } from "@/lib/supabase/client";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export default function MyPage() {
  const [childName, setChildName] = useState("");
  const [grade, setGrade] = useState(""); // "" = 未設定
  const [targetSchool, setTargetSchool] = useState("");
  const [quota, setQuota] = useState<Quota | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 認証トークンを付けて API を叩くヘルパ
  const authHeaders = useCallback(async (): Promise<Record<string, string>> => {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
  }, []);

  // 初期ロード（プロフィールとプランを並行取得）
  useEffect(() => {
    (async () => {
      try {
        const headers = await authHeaders();
        const [profileRes, quotaRes] = await Promise.all([
          fetch(`${API_BASE}/profile`, { headers }),
          fetch(`${API_BASE}/quota`, { headers }),
        ]);
        if (profileRes.ok) {
          const j = await profileRes.json();
          setChildName(j.childName ?? "");
          setGrade(j.grade != null ? String(j.grade) : "");
          setTargetSchool(j.targetSchool ?? "");
        }
        if (quotaRes.ok) {
          setQuota((await quotaRes.json()) as Quota);
        }
      } catch {
        // 取得失敗時は空のまま
      } finally {
        setLoading(false);
      }
    })();
  }, [authHeaders]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...(await authHeaders()) },
        body: JSON.stringify({
          childName: childName.trim() || null,
          grade: grade ? Number.parseInt(grade, 10) : null,
          targetSchool: targetSchool.trim() || null,
        }),
      });
      if (!res.ok) throw new Error(`保存に失敗しました（${res.status}）`);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  // Stripe顧客ポータル（解約・カード変更）へ遷移
  const handlePortal = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch(`${API_BASE}/stripe/portal`, {
        method: "POST",
        headers: await authHeaders(),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setPortalLoading(false);
        alert(data.error ?? "管理ページを開けませんでした");
      }
    } catch {
      setPortalLoading(false);
      alert("エラーが発生しました");
    }
  };

  return (
    <div className="animate-fade-in px-5 py-6">
      <h2 className="text-lg font-bold mb-6" style={{ color: "#fffdf8" }}>
        マイページ
      </h2>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={28} className="animate-spin" style={{ color: "#fffdf8" }} />
        </div>
      ) : (
        <div className="space-y-5">
          {/* ご利用プラン */}
          {quota && (
            <section className="bg-white rounded-2xl p-5 border border-gray-100 animate-slide-up space-y-3">
              <h3
                className="text-xs font-bold uppercase tracking-wider"
                style={{ color: "#7a8a82" }}
              >
                ご利用プラン
              </h3>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">プラン</span>
                <span
                  className="text-sm font-bold px-2.5 py-0.5 rounded-full"
                  style={
                    quota.plan === "light"
                      ? { background: "rgba(47,110,89,0.1)", color: "#2f6e59" }
                      : { background: "#f0f0f0", color: "#666" }
                  }
                >
                  {quota.plan === "light" ? "ライトプラン" : "無料プラン"}
                </span>
              </div>
              {quota.enabled && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">残り添削回数</span>
                  <span className="text-sm font-semibold text-gray-800">
                    {quota.remaining}
                    <span className="text-gray-400 font-normal"> / {quota.limit}回</span>
                  </span>
                </div>
              )}
              {quota.plan === "light" && quota.ticketBalance > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">チケット残数</span>
                  <span className="text-sm font-semibold text-amber-600">
                    {quota.ticketBalance}枚
                  </span>
                </div>
              )}
              {quota.plan === "light" && quota.currentPeriodEnd && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    {quota.cancelAtPeriodEnd ? "利用期限" : "次回更新日"}
                  </span>
                  <span className="text-sm font-semibold text-gray-800">
                    {new Date(quota.currentPeriodEnd).toLocaleDateString("ja-JP", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      timeZone: "UTC",
                    })}
                  </span>
                </div>
              )}
              {quota.plan === "light" && quota.cancelAtPeriodEnd && (
                <p className="text-xs text-amber-600">
                  解約予定です。利用期限まではご利用いただけます。
                </p>
              )}
              <div className="pt-2 border-t border-gray-100">
                {quota.plan === "light" ? (
                  <button
                    type="button"
                    onClick={handlePortal}
                    disabled={portalLoading}
                    className="w-full text-center text-sm font-semibold py-2 rounded-xl text-brand-dark disabled:opacity-50"
                  >
                    {portalLoading ? "..." : "プランの管理・キャンセル"}
                  </button>
                ) : (
                  <Link
                    href="/pricing"
                    className="block w-full text-center text-sm font-semibold py-2 rounded-xl text-brand-dark"
                  >
                    プランをアップグレード
                  </Link>
                )}
              </div>
            </section>
          )}

          <form onSubmit={handleSave} className="space-y-5">
            <section className="bg-white rounded-2xl p-5 border border-gray-100 animate-slide-up space-y-4">
              <h3
                className="text-xs font-bold uppercase tracking-wider"
                style={{ color: "#7a8a82" }}
              >
                お子さま情報
              </h3>

              <div>
                <label htmlFor="childName" className="text-sm font-bold block mb-1.5 text-gray-700">
                  名前
                </label>
                <input
                  id="childName"
                  type="text"
                  value={childName}
                  onChange={(e) => {
                    setChildName(e.target.value);
                    setSaved(false);
                  }}
                  placeholder="例：たろう"
                  maxLength={20}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 bg-white text-sm focus:outline-none focus:border-brand transition-all duration-200"
                />
              </div>

              <div>
                <label htmlFor="grade" className="text-sm font-bold block mb-1.5 text-gray-700">
                  学年
                </label>
                <select
                  id="grade"
                  value={grade}
                  onChange={(e) => {
                    setGrade(e.target.value);
                    setSaved(false);
                  }}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 bg-white text-sm focus:outline-none focus:border-brand transition-all duration-200"
                >
                  <option value="">未設定</option>
                  {[1, 2, 3, 4, 5, 6].map((g) => (
                    <option key={g} value={g}>
                      小学{g}年生
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="targetSchool"
                  className="text-sm font-bold block mb-1.5 text-gray-700"
                >
                  志望校
                  <span className="text-xs font-normal ml-1 text-gray-400">任意</span>
                </label>
                <input
                  id="targetSchool"
                  type="text"
                  value={targetSchool}
                  onChange={(e) => {
                    setTargetSchool(e.target.value);
                    setSaved(false);
                  }}
                  placeholder="例：〇〇中学校"
                  maxLength={50}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 bg-white text-sm focus:outline-none focus:border-brand transition-all duration-200"
                />
              </div>
            </section>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100 animate-scale-in">
                {error}
              </div>
            )}
            {saved && (
              <div className="bg-brand-light text-brand-dark text-sm px-4 py-3 rounded-xl animate-scale-in">
                保存しました
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full py-4 rounded-2xl text-white font-bold text-base disabled:opacity-40 active:scale-[0.98] transition-all duration-200"
              style={{
                background: "rgba(255,253,248,0.2)",
                border: "1px solid rgba(255,253,248,0.3)",
              }}
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={18} strokeWidth={2.5} className="animate-spin" />
                  保存中...
                </span>
              ) : (
                "保存する"
              )}
            </button>

            <div className="flex justify-center pt-2">
              <LogoutButton />
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
