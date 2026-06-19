"use client";

import { User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// トップレベル画面のみヘッダー表示（詳細画面は独自ヘッダーを持つ）
const TOP_LEVEL_PATHS = ["/dashboard", "/prompts", "/history", "/mypage"];

export default function AppHeader() {
  const pathname = usePathname();

  // 詳細画面では非表示
  const isTopLevel = TOP_LEVEL_PATHS.some((p) => pathname === p);
  if (!isTopLevel) return null;

  return (
    <header className="sticky top-0 z-50 glass-nav border-b border-gray-100">
      <div className="flex items-center justify-between px-6 h-14">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2.5">
          {/* Book mark icon — v1 そのまま（装飾なので読み上げ対象外） */}
          <svg width="28" height="22" viewBox="0 0 28 22" fill="none" aria-hidden="true">
            <rect
              x="1"
              y="0"
              width="26"
              height="22"
              rx="4"
              stroke="#2f6e59"
              strokeWidth="2.5"
              fill="none"
            />
            <rect x="0" y="0" width="14" height="22" rx="4" fill="#f8e986" fillOpacity="0.5" />
            <line x1="14" y1="3" x2="14" y2="19" stroke="#2f6e59" strokeWidth="2" />
          </svg>
          <span className="text-[22px] font-extrabold tracking-tight" style={{ color: "#2f6e59" }}>
            さくぶんゼミ
          </span>
        </Link>

        {/* 右側: マイページ（お子さま情報・ログアウト） */}
        <Link
          href="/mypage"
          aria-label="マイページ"
          className="w-9 h-9 rounded-full flex items-center justify-center text-brand hover:bg-brand-light/40 transition-colors"
        >
          <User size={18} strokeWidth={2.2} />
        </Link>
      </div>
    </header>
  );
}
