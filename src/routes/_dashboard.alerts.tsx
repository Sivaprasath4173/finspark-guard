import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EVENT_LABEL, formatRelative, SEVERITY_ORDER, type Alert, type AlertStatus, type Severity } from "@/lib/trustlens-data";
import { useTrustLens, useUserLookup } from "@/lib/trustlens-store";
import { RiskBar, SeverityChip } from "@/components/trustlens/severity";
import { AlertDetailModal } from "@/components/trustlens/AlertDetailModal";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_dashboard/alerts")({
  head: () => ({
    meta: [
      { title: "Alerts — TrustLens" },
      {
        name: "description",
        content:
          "All correlated cyber × banking alerts, sortable and filterable, with AI-written analyst briefs.",
      },
    ],
  }),
  component: AlertsPage,
});

type SortKey = "riskScore" | "amount" | "timestamp";

function AlertsPage() {
  const { alerts } = useTrustLens();
  const users = useUserLookup();
  const [sevFilter, setSevFilter] = useState<Severity | "all">("all");
  const [statusFilter, setStatusFilter] = useState<AlertStatus | "all">("all");
  const [sort, setSort] = useState<SortKey>("riskScore");
  const [selected, setSelected] = useState<Alert | null>(null);

  const filtered = useMemo(() => {
    let list = alerts;
    if (sevFilter !== "all") list = list.filter((a) => a.severity === sevFilter);
    if (statusFilter !== "all") list = list.filter((a) => a.status === statusFilter);
    return [...list].sort((a, b) => {
      if (sort === "timestamp") return b.timestamp - a.timestamp;
      return b[sort] - a[sort];
    });
  }, [alerts, sevFilter, statusFilter, sort]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Alerts</h1>
          <p className="text-sm text-muted-foreground">
            {filtered.length} alerts · correlation engine v0.4
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
                    <td className="px-3 py-3 text-right tabular-nums">
                      ${a.amount.toLocaleString()}
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">
                      {formatRelative(a.timestamp)}
                    </td>
                    <td className="px-3 py-3">
                      <StatusPill status={a.status} />
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-10 text-center text-sm text-muted-foreground">
                    No alerts match the current filters.
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
