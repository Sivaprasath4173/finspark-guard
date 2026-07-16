import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Sliders, Filter, Percent, Info } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  EVENT_LABEL, formatRelative, SEVERITY_ORDER,
  type Alert, type AlertStatus, type Severity,
} from "@/lib/trustlens-data";
import { useTrustLens, useUserLookup } from "@/lib/trustlens-store";
import { RiskBar, SeverityChip } from "@/components/trustlens/severity";
import { AlertDetailModal } from "@/components/trustlens/AlertDetailModal";
import { cn } from "@/lib/utils";

type SortKey = "riskScore" | "amount" | "timestamp";

export default function AlertsPage() {
  const {
    alerts,
    zThreshold,
    setZThreshold,
    timeWindow,
    setTimeWindow
  } = useTrustLens();

  const users = useUserLookup();
  const [sevFilter, setSevFilter] = useState<Severity | "all">("all");
  const [statusFilter, setStatusFilter] = useState<AlertStatus | "all">("all");
  const [sort, setSort] = useState<SortKey>("riskScore");
  const [selected, setSelected] = useState<Alert | null>(null);

  // Sorting and filtering
  const filtered = useMemo(() => {
    let list = alerts;
    if (sevFilter !== "all") list = list.filter((a) => a.severity === sevFilter);
    if (statusFilter !== "all") list = list.filter((a) => a.status === statusFilter);
    return [...list].sort((a, b) => {
      if (sort === "timestamp") return b.timestamp - a.timestamp;
      return b[sort] - a[sort];
    });
  }, [alerts, sevFilter, statusFilter, sort]);

  // Hackathon metric outputs based on sliders
  const noiseReduction = useMemo(() => {
    // Basic calculation showing how many potential low-quality triggers are removed
    const baseUnfiltered = 36; // Constant baseline for comparison
    const activeAlerts = alerts.length;
    const reductionPercent = Math.max(0, Math.min(95, Math.round(((baseUnfiltered - activeAlerts) / baseUnfiltered) * 100)));
    return reductionPercent;
  }, [alerts]);

  return (
    <div className="space-y-4">
      {/* Dynamic Hackathon control panel */}
      <Card className="border-primary/30 bg-gradient-to-tr from-card via-card to-primary/5 p-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full filter blur-xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 max-w-md">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              <Sliders className="h-3 w-3" />
              Dynamic False-Positive Optimizer (Hackathon Feature)
            </div>
            <h2 className="text-sm font-semibold text-foreground">Correlation Engine Calibration</h2>
            <p className="text-xs text-muted-foreground">
              Calibrate the anomaly scoring engine in real-time. Tune the Z-Score threshold and timing window to eliminate alert noise and false positives.
            </p>
          </div>

          <div className="flex flex-wrap gap-4 items-center flex-1 md:justify-end">
            {/* Z-Score threshold slider */}
            <div className="space-y-1.5 min-w-[150px]">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-muted-foreground">Min Z-Score:</span>
                <span className="text-primary font-bold">{zThreshold.toFixed(1)}σ</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="3.5"
                step="0.1"
                value={zThreshold}
                onChange={(e) => setZThreshold(parseFloat(e.target.value))}
                className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>

            {/* Time correlation window slider */}
            <div className="space-y-1.5 min-w-[150px]">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-muted-foreground">Coincidence:</span>
                <span className="text-primary font-bold">{timeWindow} mins</span>
              </div>
              <input
                type="range"
                min="10"
                max="120"
                step="5"
                value={timeWindow}
                onChange={(e) => setTimeWindow(parseInt(e.target.value))}
                className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>

            {/* Realtime Impact Stat */}
            <div className="bg-muted/40 rounded-lg p-2 flex items-center gap-2 border border-border/80 min-w-[140px]">
              <div className="rounded bg-primary/15 p-1 text-primary">
                <Percent className="h-4 w-4" />
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Noise reduction</div>
                <div className="text-sm font-bold font-mono text-primary">{noiseReduction}%</div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Alerts</h1>
          <p className="text-sm text-muted-foreground">
            Showing {filtered.length} correlated alerts
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={sevFilter} onValueChange={(v) => setSevFilter(v as Severity | "all")}>
            <SelectTrigger className="h-9 w-36 border-border/70 bg-muted/40 text-xs">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All severities</SelectItem>
              {SEVERITY_ORDER.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as AlertStatus | "all")}>
            <SelectTrigger className="h-9 w-36 border-border/70 bg-muted/40 text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="Open">Open</SelectItem>
              <SelectItem value="Blocked">Blocked</SelectItem>
              <SelectItem value="Verified">Verified</SelectItem>
              <SelectItem value="Dismissed">Dismissed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
            <SelectTrigger className="h-9 w-40 border-border/70 bg-muted/40 text-xs">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="riskScore">Sort · Risk</SelectItem>
              <SelectItem value="amount">Sort · Amount</SelectItem>
              <SelectItem value="timestamp">Sort · Newest</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="border-border bg-card p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="px-3 py-2 font-medium">Severity</th>
                <th className="px-3 py-2 font-medium">User / Account</th>
                <th className="px-3 py-2 font-medium">Risk</th>
                <th className="px-3 py-2 font-medium">Event</th>
                <th className="px-3 py-2 text-right font-medium">Amount</th>
                <th className="px-3 py-2 font-medium">Time</th>
                <th className="px-3 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => {
                const u = users.get(a.userId);
                return (
                  <tr
                    key={a.id}
                    onClick={() => setSelected(a)}
                    className={cn(
                      "cursor-pointer border-b border-border/60 transition-colors hover:bg-muted/40",
                      a.severity === "Critical" && a.status === "Open" && "tl-critical-glow",
                    )}
                  >
                    <td className="px-3 py-3"><SeverityChip severity={a.severity} /></td>
                    <td className="px-3 py-3">
                      <div className="font-medium">{u?.name ?? a.userId}</div>
                      <div className="text-xs text-muted-foreground">{u?.accountId} · {u?.tier}</div>
                    </td>
                    <td className="px-3 py-3"><RiskBar score={a.riskScore} /></td>
                    <td className="px-3 py-3">{EVENT_LABEL[a.triggeringEventType]}</td>
                    <td className="px-3 py-3 text-right tabular-nums">${a.amount.toLocaleString()}</td>
                    <td className="px-3 py-3 text-muted-foreground">{formatRelative(a.timestamp)}</td>
                    <td className="px-3 py-3"><StatusPill status={a.status} /></td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-10 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                    <Info className="h-4 w-4 text-muted-foreground" />
                    No alerts match the current filters. Adjust your calibration filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <AlertDetailModal
        alert={selected}
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
      />
    </div>
  );
}

function StatusPill({ status }: { status: AlertStatus }) {
  const map: Record<AlertStatus, string> = {
    Open: "bg-primary/15 text-primary ring-primary/30",
    Blocked: "bg-[color:var(--critical)]/15 text-[color:var(--critical)] ring-[color:var(--critical)]/30",
    Verified: "bg-[color:var(--low)]/15 text-[color:var(--low)] ring-[color:var(--low)]/30",
    Dismissed: "bg-muted text-muted-foreground ring-border",
  };
  return (
    <span className={cn("inline-flex rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset", map[status])}>
      {status}
    </span>
  );
}
