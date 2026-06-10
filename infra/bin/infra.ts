#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { SakubunZemiDnsStack } from "../lib/dns-stack";
import { SakubunZemiStack } from "../lib/sakubun-zemi-stack";

const app = new cdk.App();
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION ?? "ap-northeast-1",
};

// 永続スタック（独自ドメインのゾーン＋証明書）。一度作ったら destroy しない。
new SakubunZemiDnsStack(app, "SakubunZemiDnsStack-dev", { env });

// 本体スタック（VPC/RDS/ECS/ALB）。deploy/destroy を繰り返す。
new SakubunZemiStack(app, "SakubunZemiStack-dev", { env });
