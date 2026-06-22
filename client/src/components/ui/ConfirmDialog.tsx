import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { AlertTriangle, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { playCancel, playConfirm, playDelete, playOpen } from "@/lib/sound";

type Variant = "danger" | "default";

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: Variant;
}

interface ConfirmState extends ConfirmOptions {
  open: boolean;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

/** Replaces window.confirm with the app's own styled dialog. Resolves true/false. */
export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used inside <ConfirmProvider>");
  return ctx;
}

const DEFAULTS: ConfirmState = {
  open: false,
  title: "",
  message: undefined,
  confirmText: "Confirm",
  cancelText: "Cancel",
  variant: "default",
};

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ConfirmState>(DEFAULTS);
  const resolver = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((options) => {
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
      setState({ ...DEFAULTS, ...options, open: true });
      playOpen();
    });
  }, []);

  function settle(result: boolean) {
    setState((s) => ({ ...s, open: false }));
    resolver.current?.(result);
    resolver.current = null;
  }

  function handleConfirm() {
    if (state.variant === "danger") playDelete();
    else playConfirm();
    settle(true);
  }

  function handleCancel() {
    playCancel();
    settle(false);
  }

  const danger = state.variant === "danger";

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state.open && (
        <div
          className="fixed inset-0 z-100 grid place-items-center bg-black/70 backdrop-blur-sm p-4"
          onClick={handleCancel}
        >
          <div
            className={`card w-full max-w-sm p-6 fade-in text-center ${danger ? "alert-card" : "card-glow"}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`mx-auto mb-4 grid place-items-center w-14 h-14 rounded-full ${danger ? "alert-icon" : "bg-surface-2 border border-border"}`}>
              {danger ? <AlertTriangle size={24} className="text-danger" /> : <HelpCircle size={24} className="text-accent" />}
            </div>
            <h2 className="screen-title text-lg mb-1.5">{state.title}</h2>
            {state.message && <p className="text-muted text-[13.5px] mb-5 leading-relaxed">{state.message}</p>}
            <div className="flex gap-2.5">
              <Button variant="ghost" className="flex-1" onClick={handleCancel}>
                {state.cancelText}
              </Button>
              <Button className={danger ? "flex-1 btn-danger" : "flex-1"} onClick={handleConfirm}>
                {state.confirmText}
              </Button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
