// GA4 計装ヘルパ。User-IDは config再実行(page_view二重送信)を避けるため set で設定する。
type AnalyticsParams = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    gtag?: (command: string, ...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

// ログイン中ユーザーのUUIDをGA4のUser-IDに設定（解除はnull）。PIIは渡さない。
export function setAnalyticsUserId(userId: string | null) {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("set", { user_id: userId ?? undefined });
}

// イベント送信。paramsはPII無し（入力方法/枚数/処理時間/エラーコード等のみ）。
export function trackEvent(eventName: string, params: AnalyticsParams = {}) {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", eventName, params);
}
