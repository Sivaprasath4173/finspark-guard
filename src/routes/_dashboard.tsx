import { Outlet, createFileRoute } from "@tanstack/react-router";
import { TrustLensProvider } from "@/lib/trustlens-store";
import { AppShell } from "@/components/trustlens/AppShell";

export const Route = createFileRoute("/_dashboard")({
  component: DashboardLayout,
});

function DashboardLayout() {
  return (
    <TrustLensProvider>
      <AppShell>
        <Outlet />
      </AppShell>
    </TrustLensProvider>
  );
}
