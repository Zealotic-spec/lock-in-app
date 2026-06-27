import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { NAV } from "@/lib/nav";
import { InstallPrompt } from "@/components/InstallPrompt";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { FloatingTimer } from "@/components/FloatingTimer";
import { useTimerEngine } from "@/hooks/useTimerEngine";
import { requestNotifyPermission } from "@/lib/notify";

export function AppShell() {
  const { pathname } = useLocation();
  const current = NAV.find((n) => (n.to === "/" ? pathname === "/" : pathname.startsWith(n.to)));

  // Drives the countdown from here so the timer keeps running on every page.
  useTimerEngine();

  // Ask for notification permission once on load (browser shows a prompt).
  useEffect(() => { requestNotifyPermission(); }, []);

  return (
    <div className="flex h-dvh bg-bg overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="flex-none px-5 pt-6 pb-2 md:px-9 md:pt-9">
          <p className="eyebrow mb-1">Lock-in</p>
          <h1 className="screen-title text-[26px] md:text-[30px]">{current?.title ?? "Dashboard"}</h1>
        </header>
        <main className="flex-1 overflow-y-auto overscroll-contain px-5 pb-6 md:px-9 md:pb-10 fade-in">
          <ErrorBoundary key={pathname}>
            <Outlet />
          </ErrorBoundary>
        </main>
        <BottomNav />
      </div>
      <InstallPrompt />
      <FloatingTimer />
    </div>
  );
}
