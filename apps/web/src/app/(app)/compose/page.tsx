import ComposeForm from "@/components/ComposeForm";
import UpgradeWall from "@/components/UpgradeWall";
import { getQuota } from "@/lib/api/quota";

export const dynamic = "force-dynamic";

export default async function ComposePage() {
  const quota = await getQuota();
  // 課金有効かつ上限到達なら作文画面を出さずに壁を表示
  if (quota.enabled && !quota.canSubmit) {
    return <UpgradeWall quota={quota} />;
  }
  return <ComposeForm prompt={null} />;
}
