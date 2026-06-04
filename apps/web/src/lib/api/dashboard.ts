import { DashboardSummarySchema, type DashboardSummary } from "@sakubun-zemi/schemas";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export async function getDashboard(): Promise<DashboardSummary> {
  const res = await fetch(`${API_BASE}/dashboard`);
  if (!res.ok) {
    throw new Error(`Failed to fetch dashboard: ${res.status}`);
  }
  const json = await res.json();
  return DashboardSummarySchema.parse(json);
}
