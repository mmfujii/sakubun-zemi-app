import { Hono } from "hono";
import type Stripe from "stripe";
import { getUser } from "./auth";
import { prisma } from "./db";
import { appBaseUrl, getStripe } from "./stripe";

export const stripeRoutes = new Hono();

// ライトプランの月間添削上限（V1の subscriptions.monthly_limit default=30 相当）
const LIGHT_MONTHLY_LIMIT = Number.parseInt(process.env.LIGHT_MONTHLY_LIMIT ?? "30", 10);

// Stripeルートで投げられた例外を必ずログに出す（原因特定用）。500はJSONで返す。
stripeRoutes.onError((err, c) => {
  console.error("[stripe route error]", err);
  return c.json({ error: "決済処理に失敗しました" }, 500);
});

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
  if (sub?.plan !== "light") {
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

// Stripe Webhook（raw body＋署名検証）。サブスク状態の反映とチケット付与を行う。
// 注意: 認証(Bearer)ではなく署名で検証する。c.req.text() で生のボディを取得する。
stripeRoutes.post("/webhook", async (c) => {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return c.json({ error: "STRIPE_WEBHOOK_SECRET is not set" }, 500);
  }
  const stripe = getStripe();
  const sig = c.req.header("stripe-signature");
  if (!sig) {
    return c.json({ error: "missing signature" }, 400);
  }

  const body = await c.req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch {
    return c.json({ error: "invalid signature" }, 400);
  }

  // FK制約のため Profile を確保するヘルパ
  const ensureProfile = (userId: string) =>
    prisma.profile.upsert({ where: { id: userId }, update: {}, create: { id: userId } });

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata.user_id;
      if (!userId) {
        console.error(
          "[stripe webhook] subscription event missing user_id metadata",
          subscription.id,
        );
        break;
      }
      const isActive = ["active", "trialing"].includes(subscription.status);
      // 期末解約の検出: 新しいStripe APIでは cancel_at_period_end ではなく cancel_at(日時) に入ることがある
      const cancelScheduled =
        (subscription.cancel_at_period_end ?? false) || subscription.cancel_at != null;
      const periodEndUnix = subscription.items.data[0]?.current_period_end ?? null;
      const currentPeriodEnd = periodEndUnix ? new Date(periodEndUnix * 1000) : null;

      await ensureProfile(userId);
      await prisma.subscription.upsert({
        where: { userId },
        update: {
          plan: isActive ? "light" : "free",
          stripeSubscriptionId: subscription.id,
          currentPeriodEnd,
          cancelAtPeriodEnd: cancelScheduled,
          // light化する時だけ月上限を設定（freeでは据え置き）
          ...(isActive ? { monthlyLimit: LIGHT_MONTHLY_LIMIT } : {}),
        },
        create: {
          userId,
          plan: isActive ? "light" : "free",
          monthlyLimit: isActive ? LIGHT_MONTHLY_LIMIT : 0,
          stripeSubscriptionId: subscription.id,
          currentPeriodEnd,
          cancelAtPeriodEnd: cancelScheduled,
        },
      });
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata.user_id;
      if (!userId) break;
      await ensureProfile(userId);
      await prisma.subscription.upsert({
        where: { userId },
        update: { plan: "free", currentPeriodEnd: null, cancelAtPeriodEnd: false },
        create: { userId, plan: "free" },
      });
      break;
    }

    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.metadata?.type !== "ticket_purchase") break;
      const userId = session.metadata.user_id;
      const ticketCount = Number.parseInt(session.metadata.ticket_count ?? "0", 10);
      if (!userId || ticketCount <= 0) break;
      await ensureProfile(userId);
      await prisma.subscription.upsert({
        where: { userId },
        update: { ticketBalance: { increment: ticketCount } },
        create: { userId, ticketBalance: ticketCount },
      });
      break;
    }
  }

  return c.json({ received: true });
});
