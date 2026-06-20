import type { Quota } from "@sakubun-zemi/schemas";
import { Check, Lock, Star, Ticket } from "lucide-react";
import Link from "next/link";
import TicketCheckoutButton from "@/components/TicketCheckoutButton";

// 添削の上限に達した時に表示する壁。free→プラン案内 / light→チケット購入。
export default function UpgradeWall({ quota }: { quota: Quota }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6 animate-fade-in">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center">
            <Lock size={36} className="text-amber-600" strokeWidth={1.5} />
          </div>
        </div>

        <div className="text-center mb-8">
          {quota.plan === "free" ? (
            <>
              <h2 className="text-xl font-bold text-gray-900 mb-2">無料体験を使い切りました</h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                添削をもっと利用するには
                <br />
                ライトプランへのお申し込みが必要です
              </p>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold text-gray-900 mb-2">今月の添削回数を使い切りました</h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                月間{quota.limit}回の上限に達しました
                <br />
                チケットを購入して添削を続けられます
              </p>
            </>
          )}
        </div>

        {quota.plan === "free" && (
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-soft-lg mb-5 animate-slide-up">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-brand-light flex items-center justify-center">
                <Star size={16} className="text-brand" fill="#2f6e59" />
              </div>
              <span className="font-bold text-gray-900">ライトプラン</span>
            </div>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-3xl font-extrabold text-gray-900">980</span>
              <span className="text-sm text-gray-500">円/初月</span>
            </div>
            <p className="text-xs text-gray-400 mb-5">2ヶ月目以降 1,980円/月</p>
            <ul className="space-y-2.5 mb-6">
              <li className="flex items-center gap-2 text-sm text-gray-700">
                <Check size={16} className="text-brand flex-shrink-0" strokeWidth={2.5} />
                月間たっぷり添削
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-700">
                <Check size={16} className="text-brand flex-shrink-0" strokeWidth={2.5} />
                AIによる詳細フィードバック
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-700">
                <Check size={16} className="text-brand flex-shrink-0" strokeWidth={2.5} />
                書き直し例・漢字アドバイス
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-700">
                <Check size={16} className="text-brand flex-shrink-0" strokeWidth={2.5} />
                いつでもキャンセル可能
              </li>
            </ul>
            <Link
              href="/pricing"
              className="block w-full py-4 rounded-2xl bg-brand text-white font-bold text-center text-base shadow-brand hover:bg-brand-dark active:scale-[0.98] transition-all duration-200"
            >
              プランを見る
            </Link>
          </div>
        )}

        {quota.plan === "light" && (
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-soft-lg mb-5 animate-slide-up">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
                <Ticket size={16} className="text-amber-600" />
              </div>
              <span className="font-bold text-gray-900">添削チケット</span>
            </div>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-3xl font-extrabold text-gray-900">500</span>
              <span className="text-sm text-gray-500">円 / 5枚セット</span>
            </div>
            <p className="text-xs text-gray-400 mb-5">1枚あたり100円・有効期限なし</p>
            <ul className="space-y-2.5 mb-6">
              <li className="flex items-center gap-2 text-sm text-gray-700">
                <Check size={16} className="text-amber-600 flex-shrink-0" strokeWidth={2.5} />
                月間上限を超えて添削できる
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-700">
                <Check size={16} className="text-amber-600 flex-shrink-0" strokeWidth={2.5} />
                必要なときだけ買い足せる
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-700">
                <Check size={16} className="text-amber-600 flex-shrink-0" strokeWidth={2.5} />
                翌月以降も使える（期限なし）
              </li>
            </ul>
            <TicketCheckoutButton />
            <p className="text-center text-xs text-gray-400 mt-3">
              来月以降に月間{quota.limit}回分はリセットされます
            </p>
          </div>
        )}

        <Link
          href="/dashboard"
          className="block text-center text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          ダッシュボードに戻る
        </Link>
      </div>
    </div>
  );
}
