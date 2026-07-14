import type { InputHTMLAttributes } from "react";

export function Slider({
  gradient = "linear-gradient(90deg,#1E5A44,#8FD3A8)",
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { gradient?: string }) {
  return (
    <input
      type="range"
      className={`w-full ${className}`}
      style={{ background: gradient, accentColor: "#1E5A44" }}
      {...props}
    />
  );
}
