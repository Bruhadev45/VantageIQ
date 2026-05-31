import { useEffect, useState } from "react";
import { Toaster } from "sonner";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { DashboardPage } from "./features/shell/DashboardPage";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { AuthScreen } from "./features/auth/AuthScreen";
import { ProductTour, TOUR_STORAGE_KEY } from "./features/tour/ProductTour";

function AuthedApp() {
  const { user, loading, logout } = useAuth();
  const [showTour, setShowTour] = useState(false);

  // First-time users land in a guided tour once the dashboard has mounted.
  useEffect(() => {
    if (!user) return;
    let tourDone = false;
    try {
      tourDone = localStorage.getItem(TOUR_STORAGE_KEY) === "1";
    } catch {
      tourDone = false;
    }
    if (tourDone) return;
    const timer = window.setTimeout(() => setShowTour(true), 700);
    return () => window.clearTimeout(timer);
  }, [user]);

  if (loading) {
    return (
      <main className="app-shell loading-state">
        <div>
          <div className="spinner" />
          <p>Loading VantageIQ…</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <>
      <DashboardPage userEmail={user.email} onLogout={logout} />
      {showTour ? <ProductTour onClose={() => setShowTour(false)} /> : null}
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AuthedApp />
      </AuthProvider>
      <Toaster position="top-right" richColors theme="light" />
    </ErrorBoundary>
  );
}

export default App;
