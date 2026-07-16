/**
 * TelemetryFeed — scrollable list of the most recent correlated telemetry
 * events, shown in the Overview dashboard sidebar card.
 */
import { Card } from "@/components/ui/card";
import { EventIcon, LivePill, SeverityChip } from "@/components/trustlens/severity";
import { EVENT_LABEL, formatRelative } from "@/lib/trustlens-data";
import type { TelemetryEvent, User } from "@/types";

export interface TelemetryFeedProps {
  events: TelemetryEvent[];
  /** Map of userId → User for name resolution. */
  userMap: Map<string, User>;
  /** Max number of events to display. Defaults to 7. */
  limit?: number;
}

export function TelemetryFeed({ events, userMap, limit = 7 }: TelemetryFeedProps) {
  return (
    <Card className="border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">Telemetry feed</div>
          <div className="text-xs text-muted-foreground">Last correlated events</div>
        </div>
        <LivePill />
      </div>
      <ul className="space-y-2">
        {events.slice(0, limit).map((ev, i) => {
          const u = userMap.get(ev.userId);
          return (
            <li
              key={ev.id}
              className={`flex items-start gap-2.5 rounded-md border border-border/60 bg-[color:var(--surface-2)]/40 p-2.5 text-xs ${
                i === 0 ? "tl-row-enter" : ""
              }`}
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
  );
}
