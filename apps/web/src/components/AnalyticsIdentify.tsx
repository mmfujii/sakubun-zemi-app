"use client";

import { useEffect } from "react";
import { setAnalyticsUserId } from "@/lib/analytics";

// (app)レイアウトで描画。ログイン中ユーザーのUUIDをGA4 User-IDに設定する。
export default function AnalyticsIdentify({ userId }: { userId: string | null }) {
  useEffect(() => {
    setAnalyticsUserId(userId);
  }, [userId]);
  return null;
}
