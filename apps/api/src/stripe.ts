import Stripe from "stripe";

let _stripe: Stripe | null = null;

// STRIPE_SECRET_KEY が無い環境（AWSデモ等）は決済無効。
export const STRIPE_ENABLED = !!process.env.STRIPE_SECRET_KEY;

export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  // apiVersion は指定せずアカウント既定を使う（SDK更新時の型固定を避ける）
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return _stripe;
}

// 成功/キャンセルのリダイレクト先（webアプリのオリジン）。CORS_ORIGIN を流用。
export function appBaseUrl(): string {
  return process.env.WEB_APP_URL ?? process.env.CORS_ORIGIN ?? "http://localhost:3000";
}
