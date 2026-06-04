import { redirect } from "next/navigation";
import Link from "next/link";
import { Pen } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/LogoutButton";

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
      <div className="max-w-lg mx-auto px-6 py-12 animate-fade-in">
        {/* Header card */}
        <div className="bg-white rounded-3xl shadow-soft-lg p-8 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-brand-dark flex items-center justify-center shrink-0">
              <Pen size={24} stroke="white" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted mb-0.5">ダッシュボード</p>
              <h1 className="text-xl font-extrabold text-ink">さくぶんゼミ</h1>
            </div>
          </div>

          <p className="text-base font-medium text-ink mb-1">
            ようこそ！
          </p>
          <p className="text-sm text-muted break-all">{user.email}</p>
        </div>

        {/* Action card */}
        <div className="bg-white rounded-3xl shadow-soft-lg p-8 mb-6">
          <h2 className="text-base font-extrabold text-ink mb-4">
            作文を書いてみよう
          </h2>
          <Link
            href="/compose"
            className="flex items-center justify-between px-5 py-4 rounded-2xl bg-brand-dark text-bg font-bold text-sm hover:bg-brand active:scale-[0.98] transition-all duration-200"
          >
            <span>自由作文を書く</span>
            <Pen size={16} />
          </Link>
        </div>

        {/* Logout */}
        <div className="flex justify-center">
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}
