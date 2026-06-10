# AWS デプロイ運用手順 (runbook)

さくぶんゼミ v2 を AWS (ECS Fargate + ALB + RDS) で動かすための運用手順。
普段の開発はローカル Docker + Supabase、常時公開は Vercel。AWS は「選考期だけ起動」する。

- 本番 (Vercel, 常時): https://www.sakubun-zemi.com
- AWS (起動時のみ): https://aws.sakubun-zemi.com
- リージョン: ap-northeast-1 / AWS アカウント: 277328279575 (aws-sakubunzemi)

## スタック構成

CDK アプリ (`infra/`) には 3 つのスタックがある。

| スタック | 役割 | ライフサイクル |
|---|---|---|
| `SakubunZemiDnsStack-dev` | Route53 ゾーン (`aws.sakubun-zemi.com`) + ACM 証明書 | **永続。destroy しない** |
| `SakubunZemiGithubOidcStack-dev` | GitHub Actions OIDC デプロイロール | **永続。destroy しない** |
| `SakubunZemiStack-dev` | VPC / RDS / ECS(web,api) / ALB | deploy・destroy を繰り返す |

> スタックが複数あるので、`cdk deploy` / `cdk destroy` は**必ずスタック名を指定**する。

---

## 起動する (データ入りフル起動 = Mac から)

```bash
# 1) 本体スタックをデプロイ（独自ドメイン+HTTPS 込み。allowedIp=自分のIPをDBのSGに許可）
cd infra
npx cdk deploy SakubunZemiStack-dev \
  -c allowedIp=$(curl -s -4 ifconfig.me)/32 \
  -c useDomain=true
# セキュリティ変更の確認は y

# 2) 新しい RDS にスキーマ + お題データを投入（リポジトリのルートで実行）
cd ..
SECRET=$(aws secretsmanager get-secret-value --secret-id sakubunzemi/db \
  --region ap-northeast-1 --query SecretString --output text)
export DATABASE_URL=$(echo "$SECRET" | python3 -c "import sys,json,urllib.parse as u; d=json.load(sys.stdin); print(f\"postgresql://{d['username']}:{u.quote(d['password'])}@{d['host']}:{d['port']}/{d['dbname']}\")")
pnpm --filter @sakubun-zemi/api exec prisma migrate deploy
pnpm --filter @sakubun-zemi/api exec prisma db seed

# 3) 疎通確認
curl -s https://aws.sakubun-zemi.com/api/prompts   # お題JSONが返ればOK
```

ポイント:

- 本体を destroy すると RDS も消える（`removalPolicy: DESTROY`）ので、起動のたびに migrate + seed が要る。
- DATABASE_URL は API コンテナが db シークレットから自動生成するため、`sakubunzemi/app` には DATABASE_URL は不要（`ANTHROPIC_API_KEY` / `SUPABASE_URL` / `SUPABASE_ANON_KEY` のみ）。
- migrate/seed 後は API の再起動は不要。

## 停止する

```bash
cd infra
npx cdk destroy SakubunZemiStack-dev
```

- **本体スタックだけ** destroy する。永続 2 つ (Dns / GithubOidc) は消さない。
  消すと委任 NS や OIDC ロールが作り直しになる。
- 停止中の常時コストは Route53 ホストゾーンの約 $0.50/月のみ。課金の重い ALB/Fargate/RDS は停止する。

---

## CI / CD (GitHub Actions)

リポジトリ: `mmfujii/sakubun-zemi-app` (main 運用)

- **CI** (`.github/workflows/ci.yml`): `push` (main) と PR で biome lint + turbo typecheck。AWS 認証不要。
- **CD** (`.github/workflows/deploy.yml`): **手動のみ** (Actions → "Deploy to AWS (manual)" → Run workflow)。
  OIDC で `github-actions-deploy` ロールを Assume して `cdk deploy SakubunZemiStack-dev -c useDomain=true`。
  - Web ビルド用に repo Variables `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` が必要
    (Settings → Secrets and variables → Actions → **Variables**)。
  - **注意**: CD は infra/コードは上げるが migrate/seed は実行しない。DB の SG に runner/Mac の IP が
    入らないため、データ入りの完動デモにはならない。データ入りフル起動は上記「Mac から」を使う。
    GitHub CD は「鍵なしデプロイのショーケース」「稼働中スタックへのコード再デプロイ」用。

---

## ドメイン / DNS

- 親 `sakubun-zemi.com` は**ムームードメイン**管理 (NS: `dns01/dns02.muumuu-domain.com`)。
- サブドメイン `aws.sakubun-zemi.com` だけ Route53 に委任。
  ムームーDNS の「設定2(カスタム)」でサブドメイン `aws` / 種別 `NS` に DnsStack の NS 4 本を登録済み。
- 委任確認: `dig +short NS aws.sakubun-zemi.com` で awsdns が 4 本返れば OK。

## 初回セットアップ (一度きり・実施済み)

新しい環境で一から作る場合の参考。通常は不要。

```bash
# CDK ブートストラップ（実施済み）
cd infra && npx cdk bootstrap

# アプリ用シークレットを手動作成（sakubunzemi/app, JSON: ANTHROPIC_API_KEY / SUPABASE_URL / SUPABASE_ANON_KEY）

# ドメイン: ゾーン作成 → ムームーに NS 委任 → 委任が効いてから証明書発行
npx cdk deploy SakubunZemiDnsStack-dev                      # 出力 DelegationNameServers を控える
#   → ムームーDNS にNS4本を登録 → dig で確認
npx cdk deploy SakubunZemiDnsStack-dev -c createCert=true   # 証明書をDNS検証で発行

# OIDC デプロイロール
npx cdk deploy SakubunZemiGithubOidcStack-dev

# GitHub repo Variables に NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY を登録
```
