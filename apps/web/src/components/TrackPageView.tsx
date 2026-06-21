"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

// マウント時に1回 trackEvent を送る。サーバーコンポーネントのページに差し込んで使う。
export default function TrackPageView({ event }: { event: string }) {
  useEffect(() => {
    trackEvent(event);
  }, [event]);
  return null;
}
