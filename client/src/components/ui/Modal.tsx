import type { ReactNode } from "react";
import { X } from "lucide-react";

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="card card-glow w-full max-w-md p-5 fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="screen-title text-lg">{title}</h2>
          <button onClick={onClose} className="text-muted hover:text-white transition">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
