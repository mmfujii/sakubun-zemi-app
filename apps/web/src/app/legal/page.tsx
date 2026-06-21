import type { Metadata } from "next";
import LegalLayout from "@/components/LegalLayout";

export const metadata: Metadata = {
  title: "特定商取引法に基づく表記",
};

export default function LegalNoticePage() {
  return (
    <LegalLayout title="特定商取引法に基づく表記">
      <p className="text-xs text-gray-400 mb-6">最終更新日: 2026年3月27日</p>

      <div className="text-sm text-gray-700 leading-relaxed">
        <div className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-4">
          <div className="font-bold text-gray-900 whitespace-nowrap">販売業者</div>
          <div>穴熊舎（藤井雅史）</div>

          <div className="font-bold text-gray-900 whitespace-nowrap">運営責任者</div>
          <div>藤井雅史</div>

          <div className="font-bold text-gray-900 whitespace-nowrap">所在地</div>
          <div>請求があった場合、遅滞なく開示いたします</div>

          <div className="font-bold text-gray-900 whitespace-nowrap">電話番号</div>
          <div>請求があった場合、遅滞なく開示いたします</div>

          <div className="font-bold text-gray-900 whitespace-nowrap">メールアドレス</div>
          <div className="text-brand">support@sakubun-zemi.com</div>

          <div className="font-bold text-gray-900 whitespace-nowrap">販売URL</div>
          <div>
            <a href="https://sakubun-zemi.com" className="text-brand hover:underline">
              https://sakubun-zemi.com
            </a>
          </div>

          <div className="font-bold text-gray-900 whitespace-nowrap">販売価格</div>
          <div>ライトプラン：月額1,980円（税込）</div>

          <div className="font-bold text-gray-900 whitespace-nowrap">追加手数料</div>
          <div>なし（インターネット接続料金・通信料金はお客さまのご負担となります）</div>

          <div className="font-bold text-gray-900 whitespace-nowrap">支払方法</div>
          <div>クレジットカード（Stripe経由）</div>

          <div className="font-bold text-gray-900 whitespace-nowrap">支払時期</div>
          <div>申込時に初回決済、以降毎月自動更新</div>

          <div className="font-bold text-gray-900 whitespace-nowrap">サービス提供時期</div>
          <div>決済完了後、直ちにご利用いただけます</div>

          <div className="font-bold text-gray-900 whitespace-nowrap">キャンセル・解約</div>
          <div>
            マイページよりいつでも解約可能です。解約後も当該請求期間の終了まで引き続きご利用いただけます。日割りでの返金は行いません。
          </div>

          <div className="font-bold text-gray-900 whitespace-nowrap">動作環境</div>
          <div>最新版のGoogle Chrome、Safari、Microsoft Edgeを推奨</div>
        </div>
      </div>
    </LegalLayout>
  );
}
