import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowDownRight,
  ArrowUpRight,
  Clock,
  DollarSign,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import {
  EVENT_LABEL,
  formatRelative,
  riskTrend,
  type Alert as TLAlert,
} from "@/lib/trustlens-data";
import { useTrustLens, useUserLookup } from "@/lib/trustlens-store";
import {
  EventIcon,
  LivePill,
  RiskBar,
  SeverityChip,
} from "@/components/trustlens/severity";
import { AlertDetailModal } from "@/components/trustlens/AlertDetailModal";
import type { LucideIcon } from "lucide-react";

export default function OverviewPage() {
  const { alerts, events, liveTick } = useTrustLens();
  const users = useUserLookup();

  const openAlerts = alerts.filter((a) => a.status === "Open");
  const amountAtRisk = openAlerts.reduce((acc, a) => acc + a.amount, 0);
  const trend = useMemo(() => riskTrend(alerts), [alerts]);
  const [selected, setSelected] = useState<TLAlert | null>(null);

  const topCritical = [...alerts]
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 5);

  const [, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Overview</h1>
          <p className="text-sm text-muted-foreground">
            Correlation engine is streaming. {openAlerts.length} open alerts.
          </p>
        </div>
        <LivePill />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          Icon={ShieldAlert}
          label="Active Alerts"
          value={openAlerts.length.toString()}
          delta={{ dir: "up", text: "+12% vs yesterday" }}
          tick={liveTick}
        />
        <KpiCard
          Icon={DollarSign}
          label="Amount At Risk Today"
          value={`$${Math.round(amountAtRisk).toLocaleString()}`}
          delta={{ dir: "up", text: "+$28.4k" }}
          tick={liveTick}
          accent
        />
        <KpiCard
          Icon={Clock}
          label="Avg Detection Time"
          value="1.8 min"
          delta={{ dir: "down", text: "-24s" }}
        />
        <KpiCard
          Icon={ShieldCheck}
          label="False Positive Rate"
          value="4.2%"
          delta={{ dir: "down", text: "-0.8pt" }}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Risk trend</div>
              <div className="text-xs text-muted-foreground">
                Avg composite risk score · last 7 days
              </div>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-primary" /> Risk
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[color:var(--critical)]" />{" "}
                Alerts
              </span>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer>
              <AreaChart data={trend} margin={{ top: 6, right: 12, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="alertGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--critical)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--critical)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" strokeDasharray="2 4" vertical={false} />
                <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "var(--muted-foreground)" }}
                />
                <Area type="monotone" dataKey="risk" stroke="var(--primary)" strokeWidth={2} fill="url(#riskGrad)" />
                <Area type="monotone" dataKey="alerts" stroke="var(--critical)" strokeWidth={1.5} fill="url(#alertGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Telemetry feed</div>
              <div className="text-xs text-muted-foreground">Last correlated events</div>
            </div>
            <LivePill />
          </div>
          <ul className="space-y-2">
            {events.slice(0, 7).map((ev, i) => {
              const u = users.get(ev.userId);
              return (
                <li
                  key={ev.id}
                  className={`flex items-start gap-2.5 rounded-md border border-border/60 bg-[color:var(--surface-2)]/40 p-2.5 text-xs ${i === 0 ? "tl-row-enter" : ""}`}
                >
                  <EventIcon type={ev.type} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium text-foreground">
                        {EVENT_LABEL[ev.type]}
                      </span>
                      <SeverityChip severity={ev.severity} className="text-[10px]" />
                    </div>
                    <div className="mt-0.5 truncate text-muted-foreground">
                      {u?.name ?? ev.userId} · {ev.location}
                    </div>
                  </div>
                  <span className="whitespace-nowrap text-[10px] text-muted-foreground">
                    {formatRelative(ev.timestamp)}
                  </span>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      <Card className="border-border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">Top 5 Critical Alerts</div>
            <div className="text-xs text-muted-foreground">Highest composite risk in the last 24h</div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="px-3 py-2 font-medium">Severity</th>
                <th className="px-3 py-2 font-medium">User</th>
                <th className="px-3 py-2 font-medium">Risk</th>
                <th className="px-3 py-2 font-medium">Event</th>
                <th className="px-3 py-2 text-right font-medium">Amount</th>
                <th className="px-3 py-2 font-medium">Time</th>
              </tr>
            </thead>
            <tbody>
              {topCritical.map((a) => {
                const u = users.get(a.userId);
                return (
                  <tr
                    key={a.id}
                    onClick={() => setSelected(a)}
                    className={`cursor-pointer border-b border-border/60 transition-colors hover:bg-muted/40 ${a.severity === "Critical" ? "tl-critical-glow" : ""}`}
                  >
                    <td className="px-3 py-3"><SeverityChip severity={a.severity} /></td>
                    <td className="px-3 py-3">
                      <div className="font-medium">{u?.name ?? a.userId}</div>
                      <div className="text-xs text-muted-foreground">{u?.accountId}</div>
                    </td>
                    <td className="px-3 py-3"><RiskBar score={a.riskScore} /></td>
                    <td className="px-3 py-3">{EVENT_LABEL[a.triggeringEventType]}</td>
                    <td className="px-3 py-3 text-right tabular-nums">${a.amount.toLocaleString()}</td>
                    <td className="px-3 py-3 text-muted-foreground">{formatRelative(a.timestamp)}</td>
                  </tr>
                );
              })}
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

function KpiCard({
  Icon, label, value, delta, tick, accent,
}: {
  Icon: LucideIcon;
  label: string;
  value: string;
  delta: { dir: "up" | "down"; text: string };
  tick?: number;
  accent?: boolean;
}) {
  const [flash, setFlash] = useState(false);
  useEffect(() => {
    if (tick === undefined) return;
    setFlash(true);
    const id = setTimeout(() => setFlash(false), 500);
    return () => clearTimeout(id);
  }, [tick]);
  const goodDown = label.includes("False") || label.includes("Detection");
  const positive = delta.dir === "up" ? !goodDown : goodDown;
  return (
    <Card className="border-border bg-card p-4 transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <Icon className={`h-4 w-4 ${accent ? "text-primary" : "text-muted-foreground"}`} />
      </div>
      <div className={`mt-2 text-2xl font-semibold tracking-tight tabular-nums transition-colors ${flash ? "text-primary" : "text-foreground"}`}>
        {value}
      </div>
      <div className={`mt-1 inline-flex items-center gap-1 text-xs ${positive ? "text-[color:var(--low)]" : "text-[color:var(--critical)]"}`}>
        {delta.dir === "up" ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
        {delta.text}
      </div>
    </Card>
  );
}
