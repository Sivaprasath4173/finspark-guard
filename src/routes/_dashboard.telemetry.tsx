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
import { EVENT_LABEL, formatRelative, type EventType } from "@/lib/trustlens-data";
import { useTrustLens, useUserLookup } from "@/lib/trustlens-store";
import { EventIcon, SeverityChip, LivePill } from "@/components/trustlens/severity";

export const Route = createFileRoute("/_dashboard/telemetry")({
  head: () => ({
    meta: [
      { title: "Telemetry — TrustLens" },
      { name: "description", content: "Raw cybersecurity telemetry feed powering TrustLens correlation." },
    ],
  }),
  component: TelemetryPage,
});

const TYPES: (EventType | "all")[] = [
  "all",
  "failed_login",
  "new_device",
  "tor_ip",
  "impossible_travel",
  "malware_beacon",
];

function TelemetryPage() {
  const { events } = useTrustLens();
  const users = useUserLookup();
  const [filter, setFilter] = useState<EventType | "all">("all");

  const filtered = useMemo(
    () => (filter === "all" ? events : events.filter((e) => e.type === filter)),
    [events, filter],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Telemetry</h1>
          <p className="text-sm text-muted-foreground">
            {filtered.length} events · streaming
          </p>
        </div>
        <div className="flex items-center gap-2">
          <LivePill />
          <Select value={filter} onValueChange={(v) => setFilter(v as EventType | "all")}>
            <SelectTrigger className="h-9 w-44 border-border/70 bg-muted/40 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t === "all" ? "All event types" : EVENT_LABEL[t as EventType]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="border-border bg-card p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="px-3 py-2 font-medium">Event</th>
                <th className="px-3 py-2 font-medium">User</th>
                <th className="px-3 py-2 font-medium">IP</th>
                <th className="px-3 py-2 font-medium">Device</th>
                <th className="px-3 py-2 font-medium">Location</th>
                <th className="px-3 py-2 font-medium">Severity</th>
                <th className="px-3 py-2 font-medium">Time</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 80).map((ev, i) => {
                const u = users.get(ev.userId);
                return (
                  <tr
                    key={ev.id}
                    className={`border-b border-border/60 hover:bg-muted/40 ${i === 0 ? "tl-row-enter" : ""}`}
                  >
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <EventIcon type={ev.type} />
                        <span className="font-medium">{EVENT_LABEL[ev.type]}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="font-medium">{u?.name ?? ev.userId}</div>
                      <div className="text-xs text-muted-foreground">{u?.accountId}</div>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs">{ev.ip}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{ev.device}</td>
                    <td className="px-3 py-2.5">{ev.location}</td>
                    <td className="px-3 py-2.5"><SeverityChip severity={ev.severity} /></td>
                    <td className="px-3 py-2.5 text-muted-foreground">
                      {formatRelative(ev.timestamp)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
