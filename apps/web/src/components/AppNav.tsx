"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Home, Pen, Clock } from "lucide-react";

const navItems = [
  {
    href: "/dashboard",
    label: "ホーム",
    icon: (active: boolean) => (
      <Home size={22} strokeWidth={active ? 2.2 : 1.8} />
    ),
  },
  {
    href: "/prompts",
    label: "問題",
    icon: (active: boolean) => (
      <Pen size={22} strokeWidth={active ? 2.2 : 1.8} />
    ),
  },
  {
    href: "/history",
    label: "履歴",
    icon: (active: boolean) => (
      <Clock size={22} strokeWidth={active ? 2.2 : 1.8} />
    ),
  },
];

const SCROLL_THRESHOLD = 10;

export default function AppNav() {
  const pathname = usePathname();
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - lastScrollY.current;
      if (delta > SCROLL_THRESHOLD) {
        setHidden(true);
      } else if (delta < -SCROLL_THRESHOLD) {
        setHidden(false);
      }
      lastScrollY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* モバイル: 下部固定ナビ（スクロールで自動非表示） */}
      <nav
        className={`fixed bottom-0 left-0 right-0 glass-nav border-t border-gray-100 z-50 safe-area-bottom lg:hidden transition-transform duration-300 ${
          hidden ? "translate-y-full" : "translate-y-0"
        }`}
      >
        <div className="flex justify-around items-center py-1.5 max-w-md mx-auto">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 px-5 py-1.5 rounded-2xl transition-all duration-200 relative ${
                  isActive ? "text-brand" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {isActive && (
                  <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-5 h-1 bg-brand rounded-full animate-scale-in" />
                )}
                <span className={`transition-transform duration-200 ${isActive ? "scale-110" : ""}`}>
                  {item.icon(isActive)}
                </span>
                <span
                  className={`text-[10px] font-semibold tracking-wide transition-colors ${
                    isActive ? "text-brand" : "text-gray-400"
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* PC: 左サイドナビ */}
      <nav className="hidden lg:flex lg:flex-col lg:w-20 lg:sticky lg:top-0 lg:h-screen lg:items-center lg:justify-center lg:gap-6 lg:border-r lg:border-gray-200 lg:bg-white/80 lg:backdrop-blur-sm lg:flex-shrink-0">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-2.5 rounded-2xl transition-all duration-200 relative ${
                isActive ? "text-brand" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-brand rounded-full animate-scale-in" />
              )}
              <span className={`transition-transform duration-200 ${isActive ? "scale-110" : ""}`}>
                {item.icon(isActive)}
              </span>
              <span
                className={`text-[10px] font-semibold tracking-wide transition-colors ${
                  isActive ? "text-brand" : "text-gray-400"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
