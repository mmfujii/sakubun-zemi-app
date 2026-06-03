import * as cdk from "aws-cdk-lib";
import type { Construct } from "constructs";

export class SakubunZemiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // TODO: 後でここに RDS, Lambda, API Gateway などを追加
    new cdk.CfnOutput(this, "Placeholder", {
      value: "Initial stack — resources to be added.",
    });
  }
}
