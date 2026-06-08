import { HistoryResponseSchema, type HistoryResponse } from "@sakubun-zemi/schemas";
import { serverAuthHeader } from "./auth-header";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export async function getHistory(): Promise<HistoryResponse> {
  const res = await fetch(`${API_BASE}/history`, {
    headers: await serverAuthHeader(),
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch history: ${res.status}`);
  }
  const json = await res.json();
  return HistoryResponseSchema.parse(json);
}
