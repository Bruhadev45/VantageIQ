import { Toaster } from "sonner";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { DashboardPage } from "./features/shell/DashboardPage";

function App() {
  return (
    <ErrorBoundary>
      <DashboardPage />
      <Toaster position="top-right" richColors theme="light" />
    </ErrorBoundary>
  );
}

export default App;
