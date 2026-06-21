"use client";

import Script from "next/script";

/**
 * GA4 トラッキングスクリプト。NEXT_PUBLIC_GA_MEASUREMENT_ID がある時のみ動作。
 */
export default function GoogleAnalyticsScript() {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  if (!measurementId) return null;
  // 開発時は DebugView に出すため debug_mode を有効化
  const debug = process.env.NODE_ENV !== "production";

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${measurementId}'${debug ? ", { debug_mode: true }" : ""});
        `}
      </Script>
    </>
  );
}
