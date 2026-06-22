import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    function onPrompt(e: Event) {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    }
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (!deferred || dismissed) return null;

  return (
    <div className="fixed bottom-24 md:bottom-5 left-1/2 -translate-x-1/2 z-50 w-[min(360px,calc(100vw-32px))]">
      <div className="card card-glow p-3.5 flex items-center gap-3 fade-in">
        <div className="w-9 h-9 rounded-[10px] bg-accent grid place-items-center shrink-0">
          <Download size={17} color="#000" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13.5px] font-medium">Install Lock-in</p>
          <p className="text-[11.5px] text-muted-2">Add to your home screen for quick access</p>
        </div>
        <button
          className="btn btn-primary btn-mini"
          onClick={async () => {
            await deferred.prompt();
            setDismissed(true);
          }}
        >
          Install
        </button>
        <button className="text-muted-2 hover:text-white transition" onClick={() => setDismissed(true)} aria-label="Dismiss">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
