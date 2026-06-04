import { PromptsResponseSchema, type PromptsResponse } from "@sakubun-zemi/schemas";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export async function getPrompts(): Promise<PromptsResponse> {
  const res = await fetch(`${API_BASE}/prompts`);
  if (!res.ok) {
    throw new Error(`Failed to fetch prompts: ${res.status}`);
  }
  const json = await res.json();
  return PromptsResponseSchema.parse(json);
}
