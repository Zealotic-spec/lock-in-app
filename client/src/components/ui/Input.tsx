import type {
  InputHTMLAttributes,
  LabelHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cx } from "@/lib/utils";

export function Label(props: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className="eyebrow block mb-1.5" {...props} />;
}

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cx(
        "w-full bg-[#141414] border border-border rounded-[11px] px-3.5 py-2.5 text-[14px] text-white placeholder:text-muted-2 outline-none transition focus:border-accent focus:shadow-[0_0_0_3px_rgba(57,255,20,0.12)]",
        className,
      )}
      {...rest}
    />
  );
}

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cx(
        "w-full bg-[#141414] border border-border rounded-[11px] px-3.5 py-2.5 text-[14px] text-white placeholder:text-muted-2 outline-none transition focus:border-accent focus:shadow-[0_0_0_3px_rgba(57,255,20,0.12)] resize-none",
        className,
      )}
      {...rest}
    />
  );
}

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cx(
        "w-full bg-[#141414] border border-border rounded-[11px] px-3.5 py-2.5 text-[14px] text-white outline-none transition focus:border-accent",
        className,
      )}
      {...rest}
    >
      {children}
    </select>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mb-3.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
