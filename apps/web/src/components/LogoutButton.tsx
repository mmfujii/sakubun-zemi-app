"use client";

import { Loader2, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-brand-dark text-brand-dark font-semibold text-sm hover:bg-brand-dark/5 disabled:opacity-50 active:scale-[0.98] transition-all duration-200"
    >
      {loading ? <Loader2 className="animate-spin" size={16} /> : <LogOut size={16} />}
      ログアウト
    </button>
  );
}
