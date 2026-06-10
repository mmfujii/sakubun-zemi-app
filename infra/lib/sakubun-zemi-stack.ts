import * as fs from "node:fs";
import * as path from "node:path";
import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
import * as logs from "aws-cdk-lib/aws-logs";
import * as rds from "aws-cdk-lib/aws-rds";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import type { Construct } from "constructs";

// リポジトリルートの .env から公開値（NEXT_PUBLIC_*）を読む。
// これらは「ブラウザに焼き込む公開値」なので、Web イメージの build args に渡す必要がある。
// （anon key は publishable なのでビルド時埋め込みで問題ない）
function readRootEnv(key: string): string {
  const envPath = path.join(__dirname, "../../.env");
  try {
    for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (m && m[1] === key) return m[2].replace(/^["']|["']$/g, "");
    }
  } catch {
    // .env が無い場合は空（synth は通すが、Web のビルド時に Supabase 値が空になる点に注意）
  }
  return "";
}

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
        // RDSで現在作成可能なバージョンを指定（16.4は提供終了でエラーになったため .of で明示）
        version: rds.PostgresEngineVersion.of("16.14", "16"),
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

    // ===== フェーズC（C2）: ECS Fargate で web + api を動かし、1つのALBで公開する =====
    //   ルーティング: ALB の /          → Web(Next.js, 3000)  ＝ デフォルト
    //                 ALB の /api/*     → API(Hono, 3001)
    //   ブラウザは同一オリジン（ALB）の相対パス /api を叩くので CORS は発生しない。

    // アプリ用シークレット（DATABASE_URL / ANTHROPIC_API_KEY / SUPABASE_*）。
    // ※ deploy 前に手動で作成しておく（名前: sakubunzemi/app, JSON形式）。手順は別途。
    const appSecret = secretsmanager.Secret.fromSecretNameV2(this, "AppSecret", "sakubunzemi/app");

    // コンテナを動かす場（ECSクラスタ）＝ compose の起動役のAWS版
    const cluster = new ecs.Cluster(this, "Cluster", { vpc });

    // ALB（インターネット向け）＝ compose の ports 公開のAWS版。
    // 先に作っておくと loadBalancerDnsName を各コンテナの環境変数に渡せる。
    const alb = new elbv2.ApplicationLoadBalancer(this, "Alb", {
      vpc,
      internetFacing: true,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
    });
    // 公開オリジン（http://<alb-dns>）。Web のブラウザもこのオリジン、API もこの裏。
    const albOrigin = `http://${alb.loadBalancerDnsName}`;

    // ---- API（Hono） ----
    const apiLogGroup = new logs.LogGroup(this, "ApiLogGroup", {
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const apiTask = new ecs.FargateTaskDefinition(this, "ApiTask", {
      cpu: 256, // 0.25 vCPU
      memoryLimitMiB: 512,
    });
    apiTask.addContainer("api", {
      // cdk deploy 時に Docker でビルドし、bootstrap の ECR へ自動push される
      image: ecs.ContainerImage.fromAsset(path.join(__dirname, "../../"), {
        file: "apps/api/Dockerfile",
      }),
      portMappings: [{ containerPort: 3001 }],
      environment: {
        PORT: "3001",
        // ALB が /api/* をここへ流すので、API も /api 配下で応答させる
        API_BASE_PATH: "/api",
        // 同一オリジンなので実質不要だが、正しく ALB オリジンを許可しておく
        CORS_ORIGIN: albOrigin,
      },
      // 秘密は Secrets Manager から実行時に注入（イメージに焼かない）
      secrets: {
        DATABASE_URL: ecs.Secret.fromSecretsManager(appSecret, "DATABASE_URL"),
        ANTHROPIC_API_KEY: ecs.Secret.fromSecretsManager(appSecret, "ANTHROPIC_API_KEY"),
        SUPABASE_URL: ecs.Secret.fromSecretsManager(appSecret, "SUPABASE_URL"),
        SUPABASE_ANON_KEY: ecs.Secret.fromSecretsManager(appSecret, "SUPABASE_ANON_KEY"),
      },
      logging: ecs.LogDrivers.awsLogs({ streamPrefix: "api", logGroup: apiLogGroup }),
    });

    // api タスク用 SG（ALB からの 3001 は addTargets が自動許可。ここでは RDS への外向きを開ける）
    const apiSg = new ec2.SecurityGroup(this, "ApiSg", {
      vpc,
      description: "api Fargate tasks",
    });
    dbSg.addIngressRule(apiSg, ec2.Port.tcp(5432), "api task to RDS");

    const apiService = new ecs.FargateService(this, "ApiService", {
      cluster,
      taskDefinition: apiTask,
      desiredCount: 1,
      assignPublicIp: true,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      securityGroups: [apiSg],
      minHealthyPercent: 0,
      circuitBreaker: { rollback: true },
    });

    // ---- Web（Next.js） ----
    const webLogGroup = new logs.LogGroup(this, "WebLogGroup", {
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const webTask = new ecs.FargateTaskDefinition(this, "WebTask", {
      cpu: 256,
      memoryLimitMiB: 512,
    });
    webTask.addContainer("web", {
      image: ecs.ContainerImage.fromAsset(path.join(__dirname, "../../"), {
        file: "apps/web/Dockerfile",
        // NEXT_PUBLIC_* はビルド時にクライアントJSへ焼き込む公開値。
        // ブラウザ→API は同一オリジンの相対パス /api（CORS なし）。
        buildArgs: {
          NEXT_PUBLIC_SUPABASE_URL: readRootEnv("NEXT_PUBLIC_SUPABASE_URL"),
          NEXT_PUBLIC_SUPABASE_ANON_KEY: readRootEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
          NEXT_PUBLIC_API_URL: "/api",
          NEXT_PUBLIC_API_MOCKING: "disabled",
        },
      }),
      portMappings: [{ containerPort: 3000 }],
      environment: {
        PORT: "3000",
        NODE_ENV: "production",
        // Server Component からの取得先（絶対URLが必要）。ALB 経由で /api へ。
        API_URL: `${albOrigin}/api`,
      },
      logging: ecs.LogDrivers.awsLogs({ streamPrefix: "web", logGroup: webLogGroup }),
    });

    const webSg = new ec2.SecurityGroup(this, "WebSg", {
      vpc,
      description: "web Fargate tasks",
    });

    const webService = new ecs.FargateService(this, "WebService", {
      cluster,
      taskDefinition: webTask,
      desiredCount: 1,
      assignPublicIp: true,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      securityGroups: [webSg],
      minHealthyPercent: 0,
      circuitBreaker: { rollback: true },
    });

    // ---- ALB リスナー（パスベースで web/api に振り分け） ----
    const listener = alb.addListener("Http", { port: 80, open: true });
    // デフォルト = Web（"/" やその他すべて）
    listener.addTargets("WebTarget", {
      port: 3000,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [webService],
      // Next.js のトップはリダイレクトし得るので 200-399 を許容
      healthCheck: { path: "/", healthyHttpCodes: "200-399" },
    });
    // /api と /api/* は API（Hono の basePath=/api 配下、"/api" が health 200）
    listener.addTargets("ApiTarget", {
      port: 3001,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [apiService],
      priority: 10,
      conditions: [elbv2.ListenerCondition.pathPatterns(["/api", "/api/*"])],
      healthCheck: { path: "/api", healthyHttpCodes: "200" },
    });

    new cdk.CfnOutput(this, "AlbUrl", {
      value: albOrigin,
      description: "ALBのURL（/ ＝ Web、/api ＝ API）",
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
