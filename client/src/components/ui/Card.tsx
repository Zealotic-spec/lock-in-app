import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/utils";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  glow?: boolean;
  children: ReactNode;
}

export function Card({ glow = true, className, children, ...rest }: CardProps) {
  return (
    <div className={cx("card p-4 sm:p-[18px]", glow && "card-glow", className)} {...rest}>
      {children}
    </div>
  );
}
