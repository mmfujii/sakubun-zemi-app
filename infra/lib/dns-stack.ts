import * as cdk from "aws-cdk-lib";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as ssm from "aws-cdk-lib/aws-ssm";
import type { Construct } from "constructs";

// 永続スタック（destroy しない）: AWSデモ用サブドメインの Route53 ホストゾーンと ACM 証明書。
// 親 sakubun-zemi.com はムームードメイン管理のまま、サブドメインだけ Route53 に委任する。
//
// 2段階で deploy する:
//   1) `cdk deploy SakubunZemiDnsStack-dev`
//        → ゾーンだけ作成。出力 DelegationNameServers の NS4本を「ムームーDNS」に登録（委任）。
//          `dig +short NS aws.sakubun-zemi.com` で4本返るまで待つ（数分〜）。
//   2) 委任が live になってから `cdk deploy SakubunZemiDnsStack-dev -c createCert=true`
//        → 証明書を DNS 検証で発行し、ARN を SSM に保存（本体スタックが参照）。
//
// 本体スタック（SakubunZemiStack）は SSM の ARN と fromLookup でこのゾーンを参照するため、
// 本体を destroy/deploy してもこのスタックには一切影響しない。
export const AWS_SUBDOMAIN = "aws.sakubun-zemi.com";
export const CERT_ARN_PARAM = "/sakubunzemi/aws-cert-arn";

export class SakubunZemiDnsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // サブドメイン専用の公開ホストゾーン
    const zone = new route53.PublicHostedZone(this, "Zone", {
      zoneName: AWS_SUBDOMAIN,
    });

    // ムームーDNS に委任登録する NS 4本（このゾーンのネームサーバー）
    new cdk.CfnOutput(this, "DelegationNameServers", {
      value: cdk.Fn.join(" ", zone.hostedZoneNameServers ?? []),
      description: `ムームーDNSで ${AWS_SUBDOMAIN} の委任NSとして登録する4本`,
    });
    new cdk.CfnOutput(this, "ZoneId", { value: zone.hostedZoneId });

    // 2段階目: 委任が有効になってから -c createCert=true で証明書を発行する。
    // （委任前に作るとDNS検証が通らずスタックが待ち続けるため、あえて分ける）
    const createCert =
      this.node.tryGetContext("createCert") === "true" ||
      this.node.tryGetContext("createCert") === true;

    if (createCert) {
      // ALB 用なのでリージョン証明書（ap-northeast-1）。検証用CNAMEはこのゾーンに自動作成される。
      const cert = new acm.Certificate(this, "Cert", {
        domainName: AWS_SUBDOMAIN,
        validation: acm.CertificateValidation.fromDns(zone),
      });

      // 本体スタックが参照できるよう ARN を SSM に保存（クロススタック結合を避けて疎結合に）
      new ssm.StringParameter(this, "CertArnParam", {
        parameterName: CERT_ARN_PARAM,
        stringValue: cert.certificateArn,
      });
      new cdk.CfnOutput(this, "CertArn", { value: cert.certificateArn });
    }
  }
}
