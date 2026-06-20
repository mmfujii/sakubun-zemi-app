import { Hono } from "hono";
import { getUser } from "./auth";
import { prisma } from "./db";
import { appBaseUrl, getStripe } from "./stripe";

export const stripeRoutes = new Hono();

// ユーザーのStripe顧客IDを用意（無ければ作成して保存）
async function ensureCustomer(userId: string, email?: string): Promise<string> {
  const stripe = getStripe();
  // FK制約のため Profile を確保し、Subscription 行も用意
  await prisma.profile.upsert({ where: { id: userId }, update: {}, create: { id: userId } });
  let sub = await prisma.subscription.findUnique({ where: { userId } });
  if (!sub) {
    sub = await prisma.subscription.create({ data: { userId } });
  }
  if (sub.stripeCustomerId) return sub.stripeCustomerId;

  const customer = await stripe.customers.create({ email, metadata: { user_id: userId } });
  await prisma.subscription.update({
    where: { userId },
    data: { stripeCustomerId: customer.id },
  });
  return customer.id;
}

// サブスク用 Checkout Session を作成し、URLを返す
stripeRoutes.post("/checkout", async (c) => {
  const stripe = getStripe();
  const user = await getUser(c);
  const appUrl = appBaseUrl();

  const priceId = process.env.STRIPE_PRICE_ID;
  if (!priceId) {
    return c.json({ error: "STRIPE_PRICE_ID is not set" }, 500);
  }

  const sub = await prisma.subscription.findUnique({ where: { userId: user.id } });
  // 過去にサブスク履歴がある場合は再入会（初月クーポン対象外）
  const isReturningUser = !!sub?.stripeSubscriptionId;

  const customerId = await ensureCustomer(user.id, user.email);

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    discounts:
      process.env.STRIPE_COUPON_ID && !isReturningUser
        ? [{ coupon: process.env.STRIPE_COUPON_ID }]
        : [],
    success_url: `${appUrl}/dashboard?upgraded=true`,
    cancel_url: `${appUrl}/pricing`,
    subscription_data: { metadata: { user_id: user.id } },
  });

  return c.json({ url: session.url });
});

// チケット購入用 Checkout（ワンタイム・ライトプランのみ）
stripeRoutes.post("/ticket-checkout", async (c) => {
  const stripe = getStripe();
  const user = await getUser(c);
  const appUrl = appBaseUrl();

  const sub = await prisma.subscription.findUnique({ where: { userId: user.id } });
  if (!sub || sub.plan !== "light") {
    return c.json({ error: "チケットはライトプラン加入者のみ購入できます" }, 403);
  }

  const customerId = await ensureCustomer(user.id, user.email);

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "jpy",
          product_data: {
            name: "添削チケット 5枚セット",
            description: "月間上限を超えた添削に使えるチケットです（有効期限なし）",
          },
          unit_amount: 500,
        },
        quantity: 1,
      },
    ],
    metadata: { user_id: user.id, ticket_count: "5", type: "ticket_purchase" },
    success_url: `${appUrl}/dashboard?tickets=purchased`,
    cancel_url: `${appUrl}/compose`,
  });

  return c.json({ url: session.url });
});

// 顧客ポータル（解約・カード変更）。URLを返してフロントで遷移する
stripeRoutes.post("/portal", async (c) => {
  const stripe = getStripe();
  const user = await getUser(c);
  const appUrl = appBaseUrl();

  const sub = await prisma.subscription.findUnique({ where: { userId: user.id } });
  if (!sub?.stripeCustomerId) {
    return c.json({ error: "サブスクリプションがありません" }, 400);
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: sub.stripeCustomerId,
    return_url: `${appUrl}/mypage`,
  });

  return c.json({ url: session.url });
});
