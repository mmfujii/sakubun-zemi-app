import type { ReactNode } from "react";

type MaxWidth = "5xl" | "4xl" | "3xl" | "2xl";

interface ContainerProps {
  children: ReactNode;
  maxWidth?: MaxWidth;
  className?: string;
}

const maxWidthClass: Record<MaxWidth, string> = {
  "5xl": "max-w-5xl",
  "4xl": "max-w-4xl",
  "3xl": "max-w-3xl",
  "2xl": "max-w-2xl",
};

/**
 * Central-alignment wrapper used across every landing section.
 * Extracted because `max-w-5xl mx-auto px-5` (and variants) repeated 10+ times.
 * maxWidth prop covers 2xl/3xl/4xl/5xl variants without creating separate components.
 */
export function Container({ children, maxWidth = "5xl", className = "" }: ContainerProps) {
  return (
    <div className={`${maxWidthClass[maxWidth]} mx-auto px-5 ${className}`.trim()}>{children}</div>
  );
}
