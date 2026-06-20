import { type Quota, QuotaSchema } from "@sakubun-zemi/schemas";
import { serverAuthHeader } from "./auth-header";
import { SERVER_API_BASE } from "./server-base";

export async function getQuota(): Promise<Quota> {
  const res = await fetch(`${SERVER_API_BASE}/quota`, {
    headers: await serverAuthHeader(),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch quota: ${res.status}`);
  }
  return QuotaSchema.parse(await res.json());
}
