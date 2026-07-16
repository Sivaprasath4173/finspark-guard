import { Link, useLocation, useNavigate } from "react-router-dom";
import { TrustLensLogo } from "@/components/TrustLensLogo";
import {
  Activity,
  Bell,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  Radar,
  Search,
  ShieldAlert,
  Wallet,
  Fingerprint,
} from "lucide-react";
import { useState, useEffect, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTrustLens, useUserLookup } from "@/lib/trustlens-store";
import { EVENT_LABEL, type Alert } from "@/lib/trustlens-data";
import { AlertDetailModal } from "@/components/trustlens/AlertDetailModal";
import { onAuthStateChanged } from "firebase/auth";
import { auth, signOut } from "@/services/firebase";

const NAV = [
  { to: "/overview", label: "Overview", Icon: LayoutDashboard },
  { to: "/alerts", label: "Alerts", Icon: ShieldAlert },
  { to: "/telemetry", label: "Telemetry", Icon: Radar },
  { to: "/transactions", label: "Transactions", Icon: Wallet },
  { to: "/behavioral", label: "Behavioral", Icon: Fingerprint },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { alerts } = useTrustLens();
  const users = useUserLookup();

  const highPriorityAlerts = alerts.filter(
    (a) => a.status === "Open" && (a.severity === "Critical" || a.severity === "High")
  );

  const openCritical = alerts.filter((a) => a.status === "Open" && a.severity === "Critical").length;
  const openHigh = alerts.filter((a) => a.status === "Open" && a.severity === "High").length;
  const notifCount = openCritical + openHigh;

  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (err) {
      console.error("Sign out error", err);
    }
  };

  const name = currentUser?.displayName || (currentUser?.email === "sivaprasath4173@gmail.com" ? "Siva Prasath" : currentUser?.email ? currentUser.email.split("@")[0] : "Demo Analyst");
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-border bg-[color:var(--sidebar)] transition-transform md:static md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-14 items-center gap-2 border-b border-border px-4">
          <TrustLensLogo size={28} />
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold tracking-tight">TrustLens</span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              SOC · v0.4
            </span>
          </div>
        </div>
        <nav className="flex-1 space-y-0.5 p-2">
          {NAV.map(({ to, label, Icon }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-primary/12 text-foreground ring-1 ring-inset ring-primary/30"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className={cn("h-4 w-4", active && "text-primary")} />
                <span>{label}</span>
                {label === "Alerts" && openCritical > 0 && (
                  <span className="ml-auto rounded-full bg-[color:var(--critical)]/15 px-1.5 py-0.5 text-[10px] font-semibold text-[color:var(--critical)] ring-1 ring-inset ring-[color:var(--critical)]/40">
                    {openCritical}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border p-3">
          <div className="rounded-md bg-muted/40 p-3 text-xs text-muted-foreground ring-1 ring-inset ring-border">
            <div className="mb-1 flex items-center gap-1.5 font-medium text-foreground">
              <span className="tl-live-dot h-1.5 w-1.5 rounded-full bg-[color:var(--low)]" />
              Correlation Engine
            </div>
            <div>Streaming · {alerts.length} alerts tracked</div>
          </div>
        </div>
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-background/70 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur">
          <button
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground md:hidden"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle navigation"
          >
            <Menu className="h-4 w-4" />
          </button>
          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search users, IPs, alert IDs…"
              className="h-9 border-border/70 bg-muted/40 pl-8 text-sm placeholder:text-muted-foreground/70 focus-visible:ring-primary/40"
            />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative h-9 w-9 text-muted-foreground hover:text-foreground cursor-pointer"
                  aria-label="Notifications"
                >
                  <Bell className="h-4 w-4" />
                  {notifCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[color:var(--critical)] px-1 text-[10px] font-semibold text-white">
                      {notifCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 p-0">
                <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
                  <span className="text-xs font-semibold">Priority Alerts</span>
                  {notifCount > 0 && (
                    <span className="rounded-full bg-[color:var(--critical)]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[color:var(--critical)]">
                      {notifCount} Open
                    </span>
                  )}
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {highPriorityAlerts.length === 0 ? (
                    <div className="px-4 py-6 text-center text-xs text-muted-foreground">
                      No open critical or high severity alerts.
                    </div>
                  ) : (
                    highPriorityAlerts.map((a) => {
                      const u = users.get(a.userId);
                      return (
                        <DropdownMenuItem
                          key={a.id}
                          className="flex flex-col items-start gap-1 border-b border-border/50 px-4 py-2.5 last:border-b-0 cursor-pointer focus:bg-muted/60"
                          onClick={() => setSelectedAlert(a)}
                        >
                          <div className="flex w-full items-center justify-between gap-2">
                            <span className={cn(
                              "text-[10px] font-semibold uppercase tracking-wider",
                              a.severity === "Critical" ? "text-[color:var(--critical)]" : "text-[color:var(--high)]"
                            )}>
                              {a.severity}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              Risk {a.riskScore}
                            </span>
                          </div>
                          <div className="text-xs font-medium text-foreground">
                            {u?.name ?? a.userId}
                          </div>
                          <div className="text-[11px] text-muted-foreground line-clamp-1">
                            {EVENT_LABEL[a.triggeringEventType]} • ${a.amount.toLocaleString()}
                          </div>
                        </DropdownMenuItem>
                      );
                    })
                  )}
                </div>
                <DropdownMenuSeparator className="m-0" />
                <div className="p-1">
                  <Link
                    to="/alerts"
                    className="flex w-full items-center justify-center rounded-md py-1.5 text-center text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    View all alerts
                  </Link>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-muted cursor-pointer">
                  {currentUser?.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={name}
                      className="h-7 w-7 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary">
                      {initials}
                    </div>
                  )}
                  <span className="hidden sm:inline font-medium">{name}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel className="font-semibold">{name}</DropdownMenuLabel>
                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal -mt-1.5 truncate">
                  {currentUser?.email || "demo-analyst@bank.com"}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-xs text-muted-foreground cursor-default">
                  Role: Tier-2 · SOC
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="flex items-center gap-2 text-[color:var(--critical)] focus:text-[color:var(--critical)] cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="min-w-0 flex-1 p-4 sm:p-6">{children}</main>
      </div>

      <AlertDetailModal
        alert={selectedAlert}
        open={!!selectedAlert}
        onOpenChange={(o) => !o && setSelectedAlert(null)}
      />
    </div>
  );
}
