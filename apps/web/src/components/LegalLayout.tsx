import { Pen } from "lucide-react";
import Link from "next/link";

export default function LegalLayout({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      <header
        className="sticky top-0 z-50 border-b border-gray-100"
        style={{ backgroundColor: "#fffdf8" }}
      >
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm"
              style={{ backgroundColor: "#2f6e59" }}
            >
              <Pen size={16} stroke="white" strokeWidth={2.5} />
            </div>
            <span
              className="text-base font-extrabold tracking-tight whitespace-nowrap"
              style={{ color: "#1a3d32" }}
            >
              さくぶんゼミ
            </span>
          </Link>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/login"
              className="text-xs font-semibold px-2 py-2 whitespace-nowrap"
              style={{ color: "#7a8a82" }}
            >
              ログイン
            </Link>
            <Link
              href="/signup"
              className="text-xs font-bold text-white bg-brand hover:bg-brand-dark px-4 py-2 rounded-xl transition-all active:scale-[0.98] whitespace-nowrap"
            >
              はじめる
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-12">
        <h1 className="text-2xl font-extrabold tracking-tight mb-8" style={{ color: "#1a3d32" }}>
          {title}
        </h1>
        <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed space-y-6">
          {children}
        </div>
      </main>

      <footer className="border-t border-gray-100 py-10" style={{ backgroundColor: "#2f6e59" }}>
        <div className="max-w-5xl mx-auto px-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: "#2f6e59" }}
              >
                <Pen size={14} stroke="white" strokeWidth={2.5} />
              </div>
              <span className="text-sm font-bold" style={{ color: "#fffdf8" }}>
                さくぶんゼミ
              </span>
            </div>
            <div className="flex items-center gap-5">
              <Link href="/terms" className="text-xs" style={{ color: "rgba(255,253,248,0.8)" }}>
                利用規約
              </Link>
              <Link href="/privacy" className="text-xs" style={{ color: "rgba(255,253,248,0.8)" }}>
                プライバシーポリシー
              </Link>
              <Link href="/legal" className="text-xs" style={{ color: "rgba(255,253,248,0.8)" }}>
                特定商取引法
              </Link>
            </div>
          </div>
          <p className="text-center text-xs mt-6" style={{ color: "rgba(255,253,248,0.5)" }}>
            &copy; 2026 さくぶんゼミ
          </p>
        </div>
      </footer>
    </div>
  );
}
