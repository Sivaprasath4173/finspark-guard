import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { TrustLensProvider } from "@/lib/trustlens-store";
import { AppShell } from "@/components/trustlens/AppShell";
import LoginPage from "@/pages/Login";
import OverviewPage from "@/pages/Overview";
import AlertsPage from "@/pages/Alerts";
import TelemetryPage from "@/pages/Telemetry";
import TransactionsPage from "@/pages/Transactions";

function DashboardLayout() {
  return (
    <TrustLensProvider>
      <AppShell>
        <Routes>
          <Route path="/overview" element={<OverviewPage />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/telemetry" element={<TelemetryPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="*" element={<Navigate to="/overview" replace />} />
        </Routes>
      </AppShell>
    </TrustLensProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/*" element={<DashboardLayout />} />
      </Routes>
      <Toaster
        theme="dark"
        position="bottom-right"
        toastOptions={{
          style: {
            background: "var(--card)",
            color: "var(--foreground)",
            border: "1px solid var(--border)",
          },
        }}
      />
    </BrowserRouter>
  );
}
