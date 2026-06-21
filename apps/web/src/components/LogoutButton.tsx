"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { setAnalyticsUserId } from "@/lib/analytics";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    setAnalyticsUserId(null);
    router.push("/login");
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="text-sm font-bold transition-colors disabled:opacity-50"
      style={{ color: "#fffdf8" }}
    >
      {loading ? "ログアウト中..." : "ログアウト"}
    </button>
  );
}
