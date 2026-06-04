import type { ReactNode } from "react";

interface SectionHeadingProps {
  /** Badge label (e.g. "子ども向けフィードバック"). Pass null to omit the badge. */
  badge?: ReactNode | null;
  /** Icon shown inside the badge. */
  badgeIcon?: ReactNode;
  /** Tailwind class(es) for badge background. */
  badgeBg?: string;
  /** Tailwind class(es) for badge text color. */
  badgeColor?: string;
  /** The h2 headline text. */
  heading: ReactNode;
  /** Tailwind class(es) for heading text color. */
  headingColor?: string;
  /** Optional sub-text under the heading. */
  sub?: ReactNode;
  /** Tailwind class(es) for sub-text color. */
  subColor?: string;
}

/**
 * Badge + h2 + sub-text pattern that appears in every major landing section
 * (Feedback Showcase, Parent Analysis, FAQ, etc.).
 * Extracted because the DOM structure is identical—only colors vary per section.
 */
export function SectionHeading({
  badge,
  badgeIcon,
  badgeBg = "bg-brand-dark",
  badgeColor = "text-bg",
  heading,
  headingColor = "text-brand-dark",
  sub,
  subColor = "text-muted",
}: SectionHeadingProps) {
  return (
    <div className="text-center mb-4">
      {badge != null && (
        <div
          className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full mb-4 ${badgeBg} ${badgeColor}`}
        >
          {badgeIcon}
          {badge}
        </div>
      )}
      <h2 className={`text-2xl sm:text-3xl font-extrabold tracking-tight mb-3 ${headingColor}`}>
        {heading}
      </h2>
      {sub && <p className={`text-sm max-w-lg mx-auto ${subColor}`}>{sub}</p>}
    </div>
  );
}
