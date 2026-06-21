"use client";

import { useState } from "react";
import { trackEvent } from "@/lib/analytics";
import { createClient } from "@/lib/supabase/client";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export default function CheckoutButton() {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    trackEvent("subscription_started");
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch(`${API_BASE}/stripe/checkout`, {
        method: "POST",
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("決済ページの作成に失敗しました。もう一度お試しください。");
        setLoading(false);
      }
    } catch {
      alert("エラーが発生しました。もう一度お試しください。");
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCheckout}
      disabled={loading}
      className="w-full py-4 rounded-2xl bg-brand text-white font-bold text-base hover:bg-brand-dark active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {loading ? "処理中..." : "このプランではじめる"}
    </button>
  );
}
