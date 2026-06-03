export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-16">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900">
          さくぶんゼミ <span className="text-blue-600">v2</span>
        </h1>
        <p className="mt-4 text-lg text-slate-600">
          AI添削で小論文を鍛える練習プラットフォーム
        </p>
        <div className="mt-12 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">技術スタック</h2>
          <ul className="mt-4 space-y-2 text-slate-700">
            <li>• Next.js 15 + React 19</li>
            <li>• Hono + Zod（API & スキーマ共有）</li>
            <li>• AWS CDK（インフラ）</li>
            <li>• Tailwind CSS v4</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
