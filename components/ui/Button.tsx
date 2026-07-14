import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "cta" | "secondary" | "ghost";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-green text-white shadow-[0_8px_20px_-6px_rgba(30,90,68,0.5)]",
  cta: "bg-terracotta text-white shadow-[0_10px_22px_-8px_rgba(201,124,84,0.55)]",
  secondary: "bg-white text-ink border-2 border-border",
  ghost: "bg-transparent text-ink-faint shadow-none",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={`font-heading font-semibold rounded-[20px] px-6 py-4 text-lg transition active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 cursor-pointer ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  );
}
