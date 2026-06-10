import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as rds from "aws-cdk-lib/aws-rds";
import type { Construct } from "constructs";

// フェーズB: DBをAWSに建てる。
// ローカルの docker compose でやったことのAWS版:
//   compose ネットワーク → VPC / db コンテナ → RDS / .env のパスワード → Secrets Manager
export class SakubunZemiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 1) VPC ＝ AWS内の私設ネットワーク（compose ネットワーク「村」のAWS版）。
    //    NAT Gateway は高い（常時課金）ので置かない。RDSは外向き通信が不要なので問題なし。
    const vpc = new ec2.Vpc(this, "Vpc", {
      maxAzs: 2, // RDSは2つのAZにまたがる必要があるため最低2
      natGateways: 0,
      subnetConfiguration: [
        // Macからマイグレーションを流すため、RDSは公開サブネットに置く（デモ用）
        { name: "public", subnetType: ec2.SubnetType.PUBLIC, cidrMask: 24 },
        // 将来ECS等を入れる用の隔離サブネット（今は未使用・無料）
        { name: "isolated", subnetType: ec2.SubnetType.PRIVATE_ISOLATED, cidrMask: 24 },
      ],
    });

    // 2) RDS用セキュリティグループ ＝ 誰がDBに繋げるかのファイアウォール。
    //    `-c allowedIp=1.2.3.4/32` で渡した自分のIPからだけ 5432 を許可する。
    const dbSg = new ec2.SecurityGroup(this, "DbSg", {
      vpc,
      description: "Allow Postgres access for migrations",
    });
    const allowedIp = this.node.tryGetContext("allowedIp") as string | undefined;
    if (allowedIp) {
      dbSg.addIngressRule(
        ec2.Peer.ipv4(allowedIp),
        ec2.Port.tcp(5432),
        "Postgres from my machine (migrations)",
      );
    }

    // 3) RDS PostgreSQL ＝ db コンテナのAWS版（マネージド。AWSが運用してくれる）。
    const db = new rds.DatabaseInstance(this, "Db", {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_16_4,
      }),
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      publiclyAccessible: true, // デモ用: Macから直接マイグレーションを流すため
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.BURSTABLE4_GRAVITON, // t4g（ARM・安い）
        ec2.InstanceSize.MICRO,
      ),
      securityGroups: [dbSg],
      // 4) Secrets Manager がパスワードを自動生成して保管（.env のパスワードのAWS版）。
      //    secret には username/password/host/port/dbname がまとめて入る。
      credentials: rds.Credentials.fromGeneratedSecret("sakubun", {
        secretName: "sakubunzemi/db",
      }),
      databaseName: "sakubunzemi",
      allocatedStorage: 20, // GB（最小）
      storageEncrypted: true,
      multiAz: false, // デモなので冗長化なし（コスト優先）
      backupRetention: cdk.Duration.days(0), // デモ: 自動バックアップ無し
      deleteAutomatedBackups: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // デモ: cdk destroy で丸ごと消す
    });

    // 5) マイグレーションに使う情報を出力（デプロイ後にターミナルに表示される）。
    new cdk.CfnOutput(this, "DbEndpoint", {
      value: db.dbInstanceEndpointAddress,
      description: "RDS エンドポイント（DATABASE_URL のホスト）",
    });
    new cdk.CfnOutput(this, "DbPort", { value: db.dbInstanceEndpointPort });
    new cdk.CfnOutput(this, "DbSecretArn", {
      value: db.secret?.secretArn ?? "n/a",
      description: "パスワードが入った Secrets Manager の ARN",
    });
  }
}
