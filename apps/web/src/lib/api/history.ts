import { HistoryResponseSchema, type HistoryResponse } from "@sakubun-zemi/schemas";
import { serverAuthHeader } from "./auth-header";
import { SERVER_API_BASE } from "./server-base";

export async function getHistory(): Promise<HistoryResponse> {
  const res = await fetch(`${SERVER_API_BASE}/history`, {
    headers: await serverAuthHeader(),
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch history: ${res.status}`);
  }
  const json = await res.json();
  return HistoryResponseSchema.parse(json);
}
