import { DashboardSummarySchema, type DashboardSummary } from "@sakubun-zemi/schemas";
import { createClient } from "@/lib/supabase/client";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export async function getDashboard(): Promise<DashboardSummary> {
  // ブラウザのSupabaseセッションからアクセストークンを取得して付与（Client Componentから呼ばれる）
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const res = await fetch(`${API_BASE}/dashboard`, {
    headers: session?.access_token
      ? { Authorization: `Bearer ${session.access_token}` }
      : {},
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch dashboard: ${res.status}`);
  }
  const json = await res.json();
  return DashboardSummarySchema.parse(json);
}
