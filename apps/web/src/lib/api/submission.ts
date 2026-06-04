import { SubmissionDetailSchema, type SubmissionDetail } from "@sakubun-zemi/schemas";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export async function getSubmission(id: string): Promise<SubmissionDetail> {
  const res = await fetch(`${API_BASE}/submissions/${id}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch submission: ${res.status}`);
  }
  const json = await res.json();
  return SubmissionDetailSchema.parse(json);
}
