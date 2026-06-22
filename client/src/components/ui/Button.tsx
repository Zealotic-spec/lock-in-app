import type { ButtonHTMLAttributes } from "react";
import { cx } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost";
  size?: "default" | "mini";
}

export function Button({ variant = "primary", size = "default", className, ...rest }: ButtonProps) {
  return (
    <button
      className={cx(
        "btn",
        variant === "primary" && "btn-primary",
        variant === "ghost" && "btn-ghost",
        size === "mini" && "text-xs! px-3! py-2! rounded-[9px]",
        className,
      )}
      {...rest}
    />
  );
}
