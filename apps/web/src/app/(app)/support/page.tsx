import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import InquiryForm from "@/components/InquiryForm";

const faqs = [
  {
    q: "添削結果はどのくらいで返ってきますか？",
    a: "作文を提出すると、通常10〜30秒程度でAIによる添削結果が表示されます。",
  },
  {
    q: "途中でプランをやめられますか？",
    a: "はい、いつでもキャンセルできます。キャンセル後も、お支払い済みの期間終了まで引き続きご利用いただけます。",
  },
  {
    q: "初月半額のあとはどうなりますか？",
    a: "2ヶ月目から通常の月額料金になります。自動更新のため、特別なお手続きは不要です。",
  },
  {
    q: "お支払い方法は何がありますか？",
    a: "クレジットカードでのお支払いに対応しております。",
  },
  {
    q: "対象学年はありますか？",
    a: "小学3年生〜6年生を主な対象としていますが、それ以外のお子さまにもご利用いただけます。都立中高一貫校の適性検査対策に特化した添削を行います。",
  },
  {
    q: "添削の点数はどのように決まりますか？",
    a: "課題把握力・論理性・表現力・独自性の4つの観点で各25点、合計100点満点で評価しています。",
  },
  {
    q: "1ヶ月に何回添削できますか？",
    a: "無料プランは1回（お試し）、ライトプランは月30回まで添削できます。回数は毎月リセットされます。",
  },
  {
    q: "添削回数が足りなくなったらどうすればいいですか？",
    a: "ライトプランの方はチケット（5枚500円）を追加購入いただけます。チケットには有効期限はありません。",
  },
  {
    q: "添削結果は保存されますか？",
    a: "はい、すべての添削結果は履歴として保存されます。ダッシュボードからいつでも確認できます。",
  },
  {
    q: "子どもが一人で使えますか？",
    a: "お子さまが作文を入力し提出するだけのシンプルな操作です。添削結果はお子さま向けのやさしい表現で表示されます。保護者向けの詳しい解説は別途ご確認いただけます。",
  },
];

export default function SupportPage() {
  return (
    <div className="animate-fade-in">
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
          サポート
        </h1>
      </div>

      <div className="px-5 py-6 space-y-5">
        {/* FAQ */}
        <section className="animate-slide-up">
          <h2 className="text-sm font-bold mb-3" style={{ color: "#fffdf8" }}>
            よくある質問
          </h2>
          <div className="bg-white/95 rounded-2xl border border-white/30 overflow-hidden">
            {faqs.map((faq, i) => (
              <div key={faq.q}>
                {i > 0 && <div className="border-t border-gray-100 mx-5" />}
                <div className="px-5 py-4">
                  <p className="text-sm font-semibold text-gray-900 mb-1.5 flex items-start gap-2">
                    <span className="text-brand font-bold mt-px">Q.</span>
                    {faq.q}
                  </p>
                  <p className="text-sm text-gray-500 leading-relaxed pl-6">{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* お問い合わせ */}
        <section className="animate-slide-up stagger-1">
          <h2 className="text-sm font-bold mb-3" style={{ color: "#fffdf8" }}>
            お問い合わせ
          </h2>
          <InquiryForm />
        </section>
      </div>
    </div>
  );
}
