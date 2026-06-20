import { Check, ChevronLeft } from "lucide-react";
import Link from "next/link";
import CheckoutButton from "@/components/CheckoutButton";
import { getQuota } from "@/lib/api/quota";

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const quota = await getQuota();
  const isLight = quota.plan === "light";

  return (
    <div className="min-h-screen animate-fade-in">
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
          料金プラン
        </h1>
      </div>

      <div className="px-5 py-6 space-y-5">
        {/* 無料プラン */}
        <div className="bg-white/95 rounded-3xl p-6 border border-white/30 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-bold text-gray-900">無料プラン</p>
              <p className="text-xs text-gray-400 mt-0.5">お試し体験</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-extrabold text-gray-900">0</span>
              <span className="text-sm text-gray-400 ml-0.5">円</span>
            </div>
          </div>
          <ul className="space-y-2 mb-4">
            <li className="flex items-center gap-2 text-sm text-gray-600">
              <Check size={14} color="#9ca3af" strokeWidth={2.5} className="flex-shrink-0" />
              添削1回（お試し）
            </li>
            <li className="flex items-center gap-2 text-sm text-gray-600">
              <Check size={14} color="#9ca3af" strokeWidth={2.5} className="flex-shrink-0" />
              全機能を体験可能
            </li>
          </ul>
          {!isLight && (
            <div className="text-center py-2 text-xs text-gray-400 font-medium">現在のプラン</div>
          )}
        </div>

        {/* ライトプラン */}
        <div
          className={`rounded-3xl p-6 border-2 animate-slide-up stagger-1 ${
            isLight ? "bg-brand-light border-brand" : "bg-white/95 border-brand/30"
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-bold text-gray-900">ライトプラン</p>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand text-white">
                  おすすめ
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">しっかり添削</p>
            </div>
            <div className="text-right">
              <div className="flex items-baseline gap-0.5">
                <span className="text-2xl font-extrabold text-brand">1,980</span>
                <span className="text-sm text-gray-400">円/月</span>
              </div>
              <p className="text-xs font-semibold text-amber-600 mt-0.5">初月半額 990円</p>
            </div>
          </div>

          <ul className="space-y-2 mb-5">
            <li className="flex items-center gap-2 text-sm text-gray-700">
              <Check size={14} color="#2f6e59" strokeWidth={2.5} className="flex-shrink-0" />
              月間たっぷり添削
            </li>
            <li className="flex items-center gap-2 text-sm text-gray-700">
              <Check size={14} color="#2f6e59" strokeWidth={2.5} className="flex-shrink-0" />
              AIによる詳細フィードバック
            </li>
            <li className="flex items-center gap-2 text-sm text-gray-700">
              <Check size={14} color="#2f6e59" strokeWidth={2.5} className="flex-shrink-0" />
              書き直し例・漢字アドバイス
            </li>
            <li className="flex items-center gap-2 text-sm text-gray-700">
              <Check size={14} color="#2f6e59" strokeWidth={2.5} className="flex-shrink-0" />
              いつでもキャンセル可能
            </li>
          </ul>

          {isLight ? (
            <div className="text-center py-2 text-sm text-brand font-bold">現在のプラン</div>
          ) : (
            <CheckoutButton />
          )}
        </div>
      </div>
    </div>
  );
}
