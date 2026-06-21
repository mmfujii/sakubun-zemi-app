import type { Metadata } from "next";
import LegalLayout from "@/components/LegalLayout";

export const metadata: Metadata = {
  title: "プライバシーポリシー",
};

export default function PrivacyPage() {
  return (
    <LegalLayout title="プライバシーポリシー">
      <p className="text-xs text-gray-400 mb-6">最終更新日: 2026年3月26日</p>

      <div className="space-y-6 text-sm text-gray-700 leading-relaxed">
        <section>
          <h2 className="font-bold text-gray-900 mb-2">1. はじめに</h2>
          <p>
            穴熊舎（藤井雅史）（以下「運営者」）が運営するさくぶんゼミ（以下「本サービス」）は、ユーザーの個人情報の保護を重要な責務と考えています。本プライバシーポリシーは、本サービスにおける個人情報の取り扱いについて説明するものです。
          </p>
        </section>

        <section>
          <h2 className="font-bold text-gray-900 mb-2">2. 収集する情報</h2>
          <p>本サービスでは、以下の情報を収集します。</p>
          <div className="mt-3 space-y-3">
            <div>
              <p className="font-medium text-gray-800">アカウント情報</p>
              <p className="text-gray-600 mt-0.5">メールアドレス、パスワード（暗号化して保存）</p>
            </div>
            <div>
              <p className="font-medium text-gray-800">お子さまの情報</p>
              <p className="text-gray-600 mt-0.5">お名前（ニックネーム可）、学年</p>
            </div>
            <div>
              <p className="font-medium text-gray-800">投稿データ</p>
              <p className="text-gray-600 mt-0.5">作文の本文、添削結果</p>
            </div>
            <div>
              <p className="font-medium text-gray-800">決済情報</p>
              <p className="text-gray-600 mt-0.5">
                クレジットカード情報はStripe社が管理し、本サービスのサーバーには保存されません
              </p>
            </div>
            <div>
              <p className="font-medium text-gray-800">利用データ</p>
              <p className="text-gray-600 mt-0.5">サービスの利用履歴、アクセスログ</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="font-bold text-gray-900 mb-2">3. 情報の利用目的</h2>
          <p>収集した情報は、以下の目的で利用します。</p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-gray-600">
            <li>本サービスの提供・運営</li>
            <li>作文の添削およびフィードバックの生成</li>
            <li>ユーザーサポートへの対応</li>
            <li>サービスの改善・新機能の開発</li>
            <li>利用状況の分析・統計作成（個人を特定しない形式）</li>
            <li>有料プランの決済処理</li>
            <li>重要なお知らせや規約変更の通知</li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold text-gray-900 mb-2">4. 第三者への提供</h2>
          <p>本サービスは、以下の場合を除き、ユーザーの個人情報を第三者に提供しません。</p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-gray-600">
            <li>ユーザーの同意がある場合</li>
            <li>法令に基づく開示要請がある場合</li>
            <li>サービスの提供に必要な業務委託先（以下に記載）</li>
          </ul>
          <div className="mt-3 space-y-2">
            <div className="bg-gray-50 rounded-xl px-4 py-3">
              <p className="font-medium text-gray-800 text-xs">Anthropic</p>
              <p className="text-gray-500 text-xs mt-0.5">
                作文の添削処理および手書き作文の画像からテキストを読み取る処理（OCR）に利用。投稿された作文のテキストおよび撮影された画像データがAPIに送信されます。
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl px-4 py-3">
              <p className="font-medium text-gray-800 text-xs">Supabase</p>
              <p className="text-gray-500 text-xs mt-0.5">データベースおよび認証基盤として利用。</p>
            </div>
            <div className="bg-gray-50 rounded-xl px-4 py-3">
              <p className="font-medium text-gray-800 text-xs">Stripe</p>
              <p className="text-gray-500 text-xs mt-0.5">
                有料プランの決済処理に利用。カード情報はStripe社のみが管理します。
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="font-bold text-gray-900 mb-2">5. お子さまの個人情報について</h2>
          <p>
            本サービスは小学生のお子さまを対象としていますが、アカウント登録および利用は保護者が行うことを前提としています。お子さまの情報（お名前・学年）は添削の精度向上のために利用し、それ以外の目的では使用しません。お名前はニックネームでもご利用いただけます。
          </p>
        </section>

        <section>
          <h2 className="font-bold text-gray-900 mb-2">6. データの保管と安全管理</h2>
          <p>
            個人情報は適切な安全管理措置を講じて保管します。データは暗号化して保存されます。不正アクセス、漏洩、改ざん等の防止に努めます。
          </p>
        </section>

        <section>
          <h2 className="font-bold text-gray-900 mb-2">7. データの削除</h2>
          <p>
            ユーザーはいつでもアカウントの削除を依頼することができます。アカウント削除時には、関連する個人情報および投稿データを削除します。ただし、法令上の義務がある場合は、必要な期間保持する場合があります。
          </p>
        </section>

        <section>
          <h2 className="font-bold text-gray-900 mb-2">8. Cookieの使用</h2>
          <p>
            本サービスでは、認証状態の維持のためにCookie（またはそれに類する技術）を使用します。サービスの利用に必須のものであり、広告目的のトラッキングには使用しません。
          </p>
        </section>

        <section>
          <h2 className="font-bold text-gray-900 mb-2">9. ポリシーの変更</h2>
          <p>
            本ポリシーは必要に応じて改定することがあります。重要な変更がある場合は、本サービス上でお知らせします。
          </p>
        </section>

        <section>
          <h2 className="font-bold text-gray-900 mb-2">10. お問い合わせ</h2>
          <p>個人情報の取り扱いに関するお問い合わせは、以下のメールアドレスまでご連絡ください。</p>
          <p className="mt-2 font-medium text-brand">support@sakubun-zemi.com</p>
        </section>
      </div>
    </LegalLayout>
  );
}
