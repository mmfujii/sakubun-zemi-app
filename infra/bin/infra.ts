#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { SakubunZemiStack } from "../lib/sakubun-zemi-stack";

const app = new cdk.App();
new SakubunZemiStack(app, "SakubunZemiStack-dev", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION ?? "ap-northeast-1",
  },
});
