import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import type { Construct } from "constructs";

// 永続スタック（destroy しない）: GitHub Actions から鍵なし(OIDC)で AWS にデプロイするための
// IAM OIDC プロバイダと、デプロイ用ロールを作る。
//
// 一度だけ `cdk deploy SakubunZemiGithubOidcStack-dev` で作成。
// 出力 DeployRoleArn を .github/workflows/deploy.yml の role-to-assume に使う
// （ロール名は固定 "github-actions-deploy" なので workflow にハードコード済み）。
//
// 最小権限の考え方: このロール自体は何もできず、CDK のブートストラップロール
// (cdk-hnb659fds-*) を AssumeRole する権限だけ持つ。実際のデプロイはそのロールが行う。
const GITHUB_REPO = "mmfujii/sakubun-zemi-app";
const DEPLOY_ROLE_NAME = "github-actions-deploy";

export class SakubunZemiGithubOidcStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const { account, region } = cdk.Stack.of(this);

    // GitHub Actions の OIDC プロバイダ（アカウントに1つ。thumbprint は CDK が自動取得）
    const provider = new iam.OpenIdConnectProvider(this, "GithubOidc", {
      url: "https://token.actions.githubusercontent.com",
      clientIds: ["sts.amazonaws.com"],
    });

    // mmfujii/sakubun-zemi-app の main ブランチからのみ Assume 可能なロール
    const role = new iam.Role(this, "DeployRole", {
      roleName: DEPLOY_ROLE_NAME,
      description: "GitHub Actions OIDC deploy role for sakubun-zemi-app",
      maxSessionDuration: cdk.Duration.hours(1),
      assumedBy: new iam.OpenIdConnectPrincipal(provider, {
        StringEquals: {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
        },
        StringLike: {
          // main ブランチのワークフローに限定（feature ブランチからは不可）
          "token.actions.githubusercontent.com:sub": `repo:${GITHUB_REPO}:ref:refs/heads/main`,
        },
      }),
    });

    // CDK ブートストラップロールを AssumeRole する権限（デプロイの実体はこちらが担う）
    role.addToPolicy(
      new iam.PolicyStatement({
        sid: "AssumeCdkBootstrapRoles",
        actions: ["sts:AssumeRole"],
        resources: [`arn:aws:iam::${account}:role/cdk-hnb659fds-*`],
      }),
    );
    // cdk CLI がブートストラップのバージョンを確認するための SSM 読み取り
    role.addToPolicy(
      new iam.PolicyStatement({
        sid: "ReadCdkBootstrapVersion",
        actions: ["ssm:GetParameter", "ssm:GetParameters"],
        resources: [`arn:aws:ssm:${region}:${account}:parameter/cdk-bootstrap/hnb659fds/version`],
      }),
    );

    new cdk.CfnOutput(this, "DeployRoleArn", {
      value: role.roleArn,
      description: "deploy.yml の role-to-assume に使う ARN",
    });
  }
}
