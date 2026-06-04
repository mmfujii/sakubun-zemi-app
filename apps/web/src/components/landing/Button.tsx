import Link from "next/link";
import type { ReactNode } from "react";

type ButtonVariant = "primary" | "accent" | "outline";
type ButtonSize = "sm" | "md" | "lg";
type ButtonRadius = "xl" | "2xl";

interface ButtonProps {
  href: string;
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Corner radius. Hero/final CTAs use "2xl"; pricing/header buttons use "xl". */
  radius?: ButtonRadius;
  className?: string;
  /** Render as block-level (w-full) */
  block?: boolean;
}

const radiusClasses: Record<ButtonRadius, string> = {
  xl: "rounded-xl",
  "2xl": "rounded-2xl",
};

const variantClasses: Record<ButtonVariant, string> = {
  /** brand-dark fill — used in footer / pricing */
  primary: "bg-brand-dark text-bg hover:bg-brand transition-colors",
  /** accent fill — hero CTA, bright yellow */
  accent: "bg-accent text-brand-dark hover:brightness-105 transition-all",
  /** outline — free plan button */
  outline: "border-2 border-brand-dark text-brand-dark hover:bg-brand-dark/5 transition-colors",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "text-xs px-4 py-2",
  md: "text-sm px-6 py-3.5",
  lg: "text-base px-8 py-4",
};

/**
 * Reusable CTA link-button wrapping next/link.
 * Covers every button variant in landing (hero CTA, pricing, footer)
 * and can be used as-is in login/signup screens via variant="primary".
 * Keeping it as a thin wrapper (no state, no "use client") maximises RSC compatibility.
 */
export function Button({
  href,
  children,
  variant = "primary",
  size = "lg",
  radius = "2xl",
  className = "",
  block = false,
}: ButtonProps) {
  return (
    <Link
      href={href}
      className={[
        block ? "block w-full text-center" : "inline-flex items-center justify-center",
        "gap-2 font-bold active:scale-[0.98]",
        radiusClasses[radius],
        variantClasses[variant],
        sizeClasses[size],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </Link>
  );
}
