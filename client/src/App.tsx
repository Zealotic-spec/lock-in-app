import { lazy, Suspense, useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import LoginPage from "@/pages/Login";
import RegisterPage from "@/pages/Register";
import DashboardPage from "@/pages/Dashboard";

// Habits/Goals/Stats pull in Recharts — split them out of the initial bundle
// so the Dashboard (the page people land on most) loads as little JS as possible.
const HabitsPage = lazy(() => import("@/pages/Habits"));
const TimerPage = lazy(() => import("@/pages/Timer"));
const TasksPage = lazy(() => import("@/pages/Tasks"));
const GoalsPage = lazy(() => import("@/pages/Goals"));
const StatsPage = lazy(() => import("@/pages/Stats"));

function PageFallback() {
  return <p className="text-muted text-sm">Loading…</p>;
}

// After a redeploy, a tab that's been sitting open can ask for a lazy chunk
// (e.g. the Stats/Growth bundle) whose old filename no longer exists on the
// server. Vite reports that as a `vite:preloadError` instead of throwing
// straight into the React tree — reload once to fetch the current build
// rather than leaving the tab stuck blank.
function useStaleChunkRecovery() {
  useEffect(() => {
    function handlePreloadError(event: Event) {
      event.preventDefault();
      window.location.reload();
    }
    window.addEventListener("vite:preloadError", handlePreloadError);
    return () => window.removeEventListener("vite:preloadError", handlePreloadError);
  }, []);
}

export default function App() {
  useStaleChunkRecovery();
  const { pathname } = useLocation();

  return (
    <ErrorBoundary key={pathname}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<DashboardPage />} />
          <Route
            path="/habits"
            element={
              <Suspense fallback={<PageFallback />}>
                <HabitsPage />
              </Suspense>
            }
          />
          <Route
            path="/timer"
            element={
              <Suspense fallback={<PageFallback />}>
                <TimerPage />
              </Suspense>
            }
          />
          <Route
            path="/tasks"
            element={
              <Suspense fallback={<PageFallback />}>
                <TasksPage />
              </Suspense>
            }
          />
          <Route
            path="/goals"
            element={
              <Suspense fallback={<PageFallback />}>
                <GoalsPage />
              </Suspense>
            }
          />
          <Route
            path="/stats"
            element={
              <Suspense fallback={<PageFallback />}>
                <StatsPage />
              </Suspense>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
  );
}
