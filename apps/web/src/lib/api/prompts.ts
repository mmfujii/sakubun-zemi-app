import {
  type Prompt,
  PromptSchema,
  type PromptsResponse,
  PromptsResponseSchema,
} from "@sakubun-zemi/schemas";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export async function getPrompts(): Promise<PromptsResponse> {
  const res = await fetch(`${API_BASE}/prompts`);
  if (!res.ok) {
    throw new Error(`Failed to fetch prompts: ${res.status}`);
  }
  const json = await res.json();
  return PromptsResponseSchema.parse(json);
}

export async function getPrompt(id: string): Promise<Prompt> {
  const res = await fetch(`${API_BASE}/prompts/${id}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch prompt: ${res.status}`);
  }
  const json = await res.json();
  return PromptSchema.parse(json);
}
