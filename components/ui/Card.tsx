import type { HTMLAttributes } from "react";

export function Card({
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`bg-white rounded-[22px] shadow-[0_4px_14px_-8px_rgba(0,0,0,0.15)] ${className}`}
      {...props}
    />
  );
}
