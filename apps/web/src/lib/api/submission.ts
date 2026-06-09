import { SubmissionDetailSchema, type SubmissionDetail } from "@sakubun-zemi/schemas";
import { serverAuthHeader } from "./auth-header";
import { SERVER_API_BASE } from "./server-base";

export async function getSubmission(id: string): Promise<SubmissionDetail> {
  const res = await fetch(`${SERVER_API_BASE}/submissions/${id}`, {
    headers: await serverAuthHeader(),
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch submission: ${res.status}`);
  }
  const json = await res.json();
  return SubmissionDetailSchema.parse(json);
}
