// マイページ: お子さま情報（既定は表示、編集ボタンで編集）＋ ご利用プラン＋アカウント＋各種リンク。
"use client";

import type { Quota } from "@sakubun-zemi/schemas";
import {
  ChevronRight,
  ClipboardList,
  FileText,
  HelpCircle,
  Loader2,
  Shield,
  UserX,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
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
  const [editing, setEditing] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  // 編集キャンセル時に戻すための保存済み値スナップショット
  const savedValuesRef = useRef({ childName: "", grade: "", targetSchool: "" });

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
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setEmail(user?.email ?? "");
        const [profileRes, quotaRes] = await Promise.all([
          fetch(`${API_BASE}/profile`, { headers }),
          fetch(`${API_BASE}/quota`, { headers }),
        ]);
        if (profileRes.ok) {
          const j = await profileRes.json();
          const loaded = {
            childName: j.childName ?? "",
            grade: j.grade != null ? String(j.grade) : "",
            targetSchool: j.targetSchool ?? "",
          };
          setChildName(loaded.childName);
          setGrade(loaded.grade);
          setTargetSchool(loaded.targetSchool);
          savedValuesRef.current = loaded;
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
      savedValuesRef.current = { childName, grade, targetSchool };
      setSaved(true);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  // 編集をキャンセルして保存済みの値に戻す
  const handleCancelEdit = () => {
    const o = savedValuesRef.current;
    setChildName(o.childName);
    setGrade(o.grade);
    setTargetSchool(o.targetSchool);
    setError(null);
    setSaved(false);
    setEditing(false);
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

  const fieldInput =
    "w-full px-4 py-3 rounded-2xl border-2 border-gray-200 bg-white text-sm focus:outline-none focus:border-brand transition-all duration-200";

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

          {/* お子さま情報（既定は表示・編集ボタンで編集） */}
          <section className="bg-white rounded-2xl p-5 border border-gray-100 animate-slide-up space-y-4">
            <div className="flex items-center justify-between">
              <h3
                className="text-xs font-bold uppercase tracking-wider"
                style={{ color: "#7a8a82" }}
              >
                お子さま情報
              </h3>
              {!editing && (
                <button
                  type="button"
                  onClick={() => {
                    setEditing(true);
                    setSaved(false);
                    setError(null);
                  }}
                  className="text-xs font-semibold text-brand-dark hover:underline"
                >
                  編集
                </button>
              )}
            </div>

            {editing ? (
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label
                    htmlFor="childName"
                    className="text-sm font-bold block mb-1.5 text-gray-700"
                  >
                    名前
                  </label>
                  <input
                    id="childName"
                    type="text"
                    value={childName}
                    onChange={(e) => setChildName(e.target.value)}
                    placeholder="例：たろう"
                    maxLength={20}
                    className={fieldInput}
                  />
                </div>

                <div>
                  <label htmlFor="grade" className="text-sm font-bold block mb-1.5 text-gray-700">
                    学年
                  </label>
                  <select
                    id="grade"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className={fieldInput}
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
                    onChange={(e) => setTargetSchool(e.target.value)}
                    placeholder="例：〇〇中学校"
                    maxLength={50}
                    className={fieldInput}
                  />
                </div>

                {error && (
                  <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100 animate-scale-in">
                    {error}
                  </div>
                )}

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={saving}
                    className="flex-1 py-3 rounded-2xl border-2 border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 disabled:opacity-50 active:scale-[0.98] transition-all duration-200"
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-3 rounded-2xl bg-brand text-white font-bold text-sm hover:bg-brand-dark disabled:opacity-50 active:scale-[0.98] transition-all duration-200"
                  >
                    {saving ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 size={16} strokeWidth={2.5} className="animate-spin" />
                        保存中...
                      </span>
                    ) : (
                      "保存する"
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">名前</span>
                  <span className="text-sm font-semibold text-gray-800">
                    {childName || "未設定"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">学年</span>
                  <span className="text-sm font-semibold text-gray-800">
                    {grade ? `小学${grade}年生` : "未設定"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">志望校</span>
                  <span className="text-sm font-semibold text-gray-800">
                    {targetSchool || "未設定"}
                  </span>
                </div>
                {saved && (
                  <p className="text-xs font-semibold text-brand-dark pt-1">保存しました</p>
                )}
              </div>
            )}
          </section>

          {/* アカウント */}
          <section className="bg-white rounded-2xl p-5 border border-gray-100 animate-slide-up">
            <h3
              className="text-xs font-bold uppercase tracking-wider mb-3"
              style={{ color: "#7a8a82" }}
            >
              アカウント
            </h3>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">メールアドレス</span>
              <span className="text-sm font-semibold text-gray-800 truncate ml-4">{email}</span>
            </div>
          </section>

          {/* リンク一覧 */}
          <section className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-slide-up">
            {[
              {
                href: "/support",
                label: "サポート・よくある質問",
                icon: <HelpCircle size={16} stroke="#2f6e59" />,
              },
              {
                href: "/terms",
                label: "利用規約",
                icon: <FileText size={16} stroke="#2f6e59" />,
              },
              {
                href: "/privacy",
                label: "プライバシーポリシー",
                icon: <Shield size={16} stroke="#2f6e59" />,
              },
              {
                href: "/legal",
                label: "特定商取引法に基づく表記",
                icon: <ClipboardList size={16} stroke="#2f6e59" />,
              },
              {
                href: "/withdraw",
                label: "退会について",
                icon: <UserX size={16} stroke="#2f6e59" />,
              },
            ].map((item, i) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors ${
                  i > 0 ? "border-t border-gray-100" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: "#e8f0ea" }}
                  >
                    {item.icon}
                  </div>
                  <span className="text-sm font-medium text-gray-800">{item.label}</span>
                </div>
                <ChevronRight size={16} stroke="#b0c4b8" />
              </Link>
            ))}
          </section>

          {/* ログアウト */}
          <div className="flex justify-center pt-2">
            <LogoutButton />
          </div>
        </div>
      )}
    </div>
  );
}
