#!/usr/bin/env bash
# AWS の本体スタックを停止（destroy）してクレジットを温存する。
#   永続スタック（Dns / OIDC）は残す。課金の重い ALB / Fargate / RDS のみ削除。
# 使い方: cd infra && pnpm aws:down   （または bash scripts/aws-down.sh）
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_DIR="$(dirname "$SCRIPT_DIR")"
cd "$INFRA_DIR"

echo "▶ 本体スタック SakubunZemiStack-dev を destroy（Dns/OIDC は保持）"
npx cdk destroy SakubunZemiStack-dev --force

echo "✅ 停止完了。ALB/Fargate/RDS を削除（RDS のデータも消えるので次回は pnpm aws:up で再投入）。"
