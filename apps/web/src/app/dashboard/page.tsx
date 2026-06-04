import { redirect } from "next/navigation";
import { CheckCircle2, FileText, Pen, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/LogoutButton";
import { Button, Container } from "@/components/landing";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Middleware already guards this route, but we add a belt-and-suspenders check.
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-brand-texture">
      {/* ─── Top bar ─── */}
      <header className="bg-brand-dark/90 backdrop-blur-sm px-5 py-3">
        <Container maxWidth="3xl" className="flex items-center justify-between gap-3">
          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-accent">
              <Pen size={15} className="text-brand-dark" strokeWidth={2.5} />
            </div>
            <span className="text-sm font-extrabold tracking-tight text-bg">さくぶんゼミ</span>
          </div>

          {/* User info + logout */}
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-xs text-bg/60 truncate hidden sm:block">{user.email}</span>
            <LogoutButton />
          </div>
        </Container>
      </header>

      {/* ─── Main content ─── */}
      <main className="py-10 px-5">
        <Container maxWidth="2xl" className="animate-fade-in space-y-6">

          {/* Welcome card + primary CTA */}
          <div className="bg-white rounded-3xl shadow-soft-lg p-8">
            <p className="text-xs font-semibold text-muted mb-1">ダッシュボード</p>
            <h1 className="text-2xl font-extrabold text-ink mb-1">ようこそ！</h1>
            <p className="text-sm text-muted break-all mb-6">{user.email}</p>

            <Button href="/compose" variant="primary" block size="md" radius="2xl">
              <Pen size={16} />
              作文を書く
            </Button>
          </div>

          {/* History section */}
          <div className="bg-white rounded-3xl shadow-soft-lg p-8">
            <h2 className="text-base font-extrabold text-ink mb-4">これまでの添削</h2>

            {/* Empty state */}
            <div className="flex flex-col items-center text-center py-8 px-4">
              <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center mb-4">
                <FileText size={24} className="text-brand-dark/50" />
              </div>
              <p className="text-sm font-semibold text-ink mb-1">まだ添削した作文はありません</p>
              <p className="text-xs text-muted mb-5">最初の作文を書いてみましょう！</p>
              <Button href="/compose" variant="outline" size="sm" radius="xl">
                最初の作文を書く
              </Button>
            </div>
            {/* TODO: 作文保存が実装されたら、ここに履歴カードのリストを差し込む */}
          </div>

          {/* How-to 3 steps */}
          <div className="bg-white rounded-3xl shadow-soft-lg p-8">
            <h2 className="text-base font-extrabold text-ink mb-5">使い方</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                {
                  step: "1",
                  icon: <Pen size={20} className="text-brand-dark" strokeWidth={2.5} />,
                  title: "作文を書く",
                  desc: "キーボード・音声入力・手書き写真から選べる",
                },
                {
                  step: "2",
                  icon: <Sparkles size={20} className="text-brand-dark" strokeWidth={2.5} />,
                  title: "AIが添削",
                  desc: "やさしい言葉で良い点・改善点をフィードバック",
                },
                {
                  step: "3",
                  icon: <CheckCircle2 size={20} className="text-brand-dark" strokeWidth={2.5} />,
                  title: "結果を確認",
                  desc: "スコア・漢字アドバイス・原稿用紙表示つき",
                },
              ].map((item) => (
                <div key={item.step} className="flex sm:flex-col items-start sm:items-center sm:text-center gap-4">
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-accent">
                      {item.icon}
                    </div>
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center bg-brand-dark">
                      {item.step}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-ink mb-0.5">{item.title}</p>
                    <p className="text-xs text-muted leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </Container>
      </main>
    </div>
  );
}
