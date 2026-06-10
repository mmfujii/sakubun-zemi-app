#!/usr/bin/env bash
# AWS をワンコマンドで「データ入りフル起動」する。
#   deploy（自分のIPをDB許可・独自ドメイン+HTTPS）→ migrate → seed → URL表示
# 使い方: cd infra && pnpm aws:up   （または bash scripts/aws-up.sh）
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_DIR="$(dirname "$SCRIPT_DIR")"
REPO_ROOT="$(dirname "$INFRA_DIR")"
REGION="ap-northeast-1"
STACK="SakubunZemiStack-dev"

echo "▶ 1/3 本体スタックをデプロイ（allowedIp=自分のIP, useDomain=true）"
IP="$(curl -s -4 ifconfig.me)/32"
echo "   allowedIp=$IP"
cd "$INFRA_DIR"
# --require-approval never: ワンコマンド用にセキュリティ確認プロンプトを省略
npx cdk deploy "$STACK" -c allowedIp="$IP" -c useDomain=true --require-approval never

echo "▶ 2/3 DATABASE_URL を db シークレットから組み立て"
SECRET="$(aws secretsmanager get-secret-value --secret-id sakubunzemi/db \
  --region "$REGION" --query SecretString --output text)"
export DATABASE_URL="$(echo "$SECRET" | python3 -c "import sys,json,urllib.parse as u; d=json.load(sys.stdin); print(f\"postgresql://{d['username']}:{u.quote(d['password'])}@{d['host']}:{d['port']}/{d['dbname']}\")")"

echo "▶ 3/3 migrate + seed（新しい RDS にスキーマとお題データを投入）"
cd "$REPO_ROOT"
pnpm --filter @sakubun-zemi/api exec prisma migrate deploy
pnpm --filter @sakubun-zemi/api exec prisma db seed

URL="$(aws cloudformation describe-stacks --stack-name "$STACK" --region "$REGION" \
  --query "Stacks[0].Outputs[?OutputKey=='AlbUrl'].OutputValue" --output text)"
echo ""
echo "✅ 起動完了: $URL"
echo "   停止は: pnpm aws:down"
