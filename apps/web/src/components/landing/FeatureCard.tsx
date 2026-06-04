import type { ReactNode } from "react";

interface FeatureCardProps {
  /** Icon element rendered inside the accent-colored icon box. */
  icon: ReactNode;
  /** Card title (bold, ink color). */
  title: string;
  /** Description text (small, muted). */
  desc: string;
  /**
   * Layout variant:
   *  - "row"    : icon box left + title right (used in Feedback Showcase 2-column grid)
   *  - "center" : icon box centered above title (used in "そのほかの特長" 4-column grid)
   */
  layout?: "row" | "center";
  /** Extra wrapper className (e.g. bg override, border). */
  className?: string;
  /** Icon box size class. Defaults to "w-11 h-11". */
  iconBoxSize?: string;
}

/**
 * Icon + title + description card used in three sections:
 *   1. Feedback Showcase (4 cards, row layout, white/glass bg)
 *   2. Parent Analysis features (4 cards, row layout, white bg, border-gray-100)
 *   3. その他の特長 (4 cards, center layout, white bg)
 * Extracted because the internal DOM structure is identical; only layout/bg differ.
 */
export function FeatureCard({
  icon,
  title,
  desc,
  layout = "row",
  className = "",
  iconBoxSize = "w-11 h-11",
}: FeatureCardProps) {
  if (layout === "center") {
    return (
      <div
        className={`bg-white rounded-2xl p-5 border border-gray-100 shadow-soft text-center ${className}`.trim()}
      >
        <div
          className={`${iconBoxSize} rounded-xl flex items-center justify-center mx-auto mb-3 bg-accent`}
        >
          {icon}
        </div>
        <h3 className="font-bold text-sm mb-1.5 text-ink">{title}</h3>
        <p className="text-xs leading-relaxed text-muted">{desc}</p>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl p-6 shadow-soft ${className}`.trim()}>
      <div className="flex items-center gap-3 mb-3">
        <div
          className={`${iconBoxSize} rounded-xl flex items-center justify-center shrink-0 bg-accent`}
        >
          {icon}
        </div>
        <h3 className="font-bold text-ink">{title}</h3>
      </div>
      <p className="text-sm leading-relaxed text-muted">{desc}</p>
    </div>
  );
}
