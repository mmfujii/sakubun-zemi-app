import { redirect } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import AppNav from "@/components/AppNav";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div
      className="min-h-screen lg:flex lg:max-w-[1200px] lg:mx-auto"
      style={{
        background: "#5fa488 url(/green-texture.png)",
        backgroundSize: "400px 400px",
      }}
    >
      {/* PC: 左サイドナビ / モバイル: 下部固定ナビ */}
      <AppNav />
      {/* コンテンツエリア */}
      <main className="flex-1 pb-20 lg:pb-0">
        <AppHeader />
        {children}
      </main>
    </div>
  );
}
