import type { Metadata } from "next";
import LegalLayout from "@/components/LegalLayout";

export const metadata: Metadata = {
  title: "利用規約",
};

export default function TermsPage() {
  return (
    <LegalLayout title="利用規約">
      <p className="text-xs text-gray-400 mb-6">最終更新日: 2026年3月26日</p>

      <div className="space-y-6 text-sm text-gray-700 leading-relaxed">
        <section>
          <h2 className="font-bold text-gray-900 mb-2">第1条（適用）</h2>
          <p>
            本利用規約（以下「本規約」）は、穴熊舎（藤井雅史）（以下「運営者」）が運営するさくぶんゼミ（以下「本サービス」）の利用に関する条件を定めるものです。ご利用の皆さま（以下「ユーザー」）には、本規約に同意いただいたうえで本サービスをご利用いただきます。
          </p>
        </section>

        <section>
          <h2 className="font-bold text-gray-900 mb-2">第2条（サービスの内容）</h2>
          <p>
            本サービスは、AI（人工知能）を活用した作文添削サービスです。小学生を対象とし、保護者が子どもの作文学習をサポートすることを目的としています。AIによるフィードバックは学習支援を目的としたものであり、その正確性や完全性を保証するものではありません。
          </p>
        </section>

        <section>
          <h2 className="font-bold text-gray-900 mb-2">第3条（アカウント登録）</h2>
          <p>
            本サービスの利用にはアカウント登録が必要です。登録時に提供する情報は正確かつ最新のものである必要があります。アカウントの管理責任はユーザーに帰属し、第三者への貸与・譲渡はできません。
          </p>
        </section>

        <section>
          <h2 className="font-bold text-gray-900 mb-2">第4条（料金および支払い）</h2>
          <p>
            本サービスには無料プランと有料プラン（ライトプラン）があります。有料プランの料金は月額制で、Stripeを通じたクレジットカード決済により支払いが行われます。料金は事前に表示された金額に基づきます。有料プランは自動更新され、解約手続きを行わない限り継続されます。
          </p>
        </section>

        <section>
          <h2 className="font-bold text-gray-900 mb-2">第5条（解約・返金）</h2>
          <p>
            有料プランの解約はいつでも可能です。解約した場合、当該請求期間の終了まで引き続きサービスをご利用いただけます。日割りでの返金は原則として行いません。
          </p>
        </section>

        <section>
          <h2 className="font-bold text-gray-900 mb-2">第6条（禁止事項）</h2>
          <p>ユーザーは以下の行為を行ってはなりません。</p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-gray-600">
            <li>法令または公序良俗に反する行為</li>
            <li>本サービスの運営を妨害する行為</li>
            <li>他のユーザーまたは第三者の権利を侵害する行為</li>
            <li>不正アクセスやシステムへの攻撃</li>
            <li>本サービスの自動化された利用（スクレイピング等）</li>
            <li>その他、運営者が不適切と判断する行為</li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold text-gray-900 mb-2">第7条（知的財産権）</h2>
          <p>
            本サービスに関する知的財産権は運営者に帰属します。ユーザーが投稿した作文の著作権はユーザーに帰属しますが、サービスの改善・品質向上の目的で、匿名化したうえで利用させていただく場合があります。
          </p>
        </section>

        <section>
          <h2 className="font-bold text-gray-900 mb-2">第8条（免責事項）</h2>
          <p>
            本サービスはAIによる自動添削であり、フィードバックの正確性・完全性を保証するものではありません。本サービスの利用に起因するいかなる損害についても、運営者は故意または重過失がある場合を除き、責任を負いません。サービスの一時的な中断・停止が発生する場合があります。
          </p>
        </section>

        <section>
          <h2 className="font-bold text-gray-900 mb-2">第9条（サービスの変更・終了）</h2>
          <p>
            運営者は、ユーザーへの事前通知をもって、本サービスの内容変更や提供終了を行うことができます。
          </p>
        </section>

        <section>
          <h2 className="font-bold text-gray-900 mb-2">第10条（規約の変更）</h2>
          <p>
            運営者は必要に応じて本規約を変更できるものとします。変更後の規約は本サービス上に掲載した時点で効力を生じます。変更後にサービスを利用した場合、変更に同意したものとみなします。
          </p>
        </section>

        <section>
          <h2 className="font-bold text-gray-900 mb-2">第11条（準拠法・管轄）</h2>
          <p>
            本規約は日本法に準拠し、本サービスに関する紛争については東京地方裁判所を第一審の専属的合意管轄裁判所とします。
          </p>
        </section>
      </div>
    </LegalLayout>
  );
}
