import { AlertTriangle, ShieldAlert, ShieldCheck, Zap } from "lucide-react";
import type { Severity, EventType } from "@/lib/trustlens-data";
import { cn } from "@/lib/utils";

export function SeverityChip({
  severity,
  className,
}: {
  severity: Severity;
  className?: string;
}) {
  const map: Record<Severity, { text: string; dot: string; ring: string }> = {
    Critical: {
      text: "text-[color:var(--critical)]",
      dot: "bg-[color:var(--critical)]",
      ring: "ring-[color:var(--critical)]/40 bg-[color:var(--critical)]/10",
    },
    High: {
      text: "text-[color:var(--high)]",
      dot: "bg-[color:var(--high)]",
      ring: "ring-[color:var(--high)]/40 bg-[color:var(--high)]/10",
    },
    Medium: {
      text: "text-[color:var(--medium)]",
      dot: "bg-[color:var(--medium)]",
      ring: "ring-[color:var(--medium)]/40 bg-[color:var(--medium)]/10",
    },
    Low: {
      text: "text-[color:var(--low)]",
      dot: "bg-[color:var(--low)]",
      ring: "ring-[color:var(--low)]/40 bg-[color:var(--low)]/10",
    },
  };
  const s = map[severity];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        s.text,
        s.ring,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
      {severity}
    </span>
  );
}

export function RiskBar({ score }: { score: number }) {
  const color =
    score >= 82
      ? "var(--critical)"
      : score >= 65
        ? "var(--high)"
        : score >= 45
          ? "var(--medium)"
          : "var(--low)";
  return (
    <div className="flex items-center gap-2">
      <div className="relative h-1.5 w-24 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
      <span className="tabular-nums text-xs text-muted-foreground w-8 text-right">
        {score}
      </span>
    </div>
  );
}

const EVENT_ICONS: Record<EventType, { Icon: typeof AlertTriangle; color: string }> = {
  failed_login: { Icon: ShieldAlert, color: "var(--medium)" },
  new_device: { Icon: ShieldCheck, color: "var(--primary)" },
  tor_ip: { Icon: Zap, color: "var(--high)" },
  impossible_travel: { Icon: AlertTriangle, color: "var(--high)" },
  malware_beacon: { Icon: Zap, color: "var(--critical)" },
};

export function EventIcon({ type }: { type: EventType }) {
  const { Icon, color } = EVENT_ICONS[type];
  return (
    <span
      className="inline-flex h-6 w-6 items-center justify-center rounded-md ring-1 ring-inset"
      style={{
        color,
        backgroundColor: `color-mix(in oklab, ${color} 12%, transparent)`,
        // @ts-expect-error CSS var
        "--tw-ring-color": `color-mix(in oklab, ${color} 40%, transparent)`,
      }}
    >
      <Icon className="h-3.5 w-3.5" />
    </span>
  );
}

export function LivePill() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--critical)]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[color:var(--critical)] ring-1 ring-inset ring-[color:var(--critical)]/30">
      <span className="tl-live-dot h-1.5 w-1.5 rounded-full bg-[color:var(--critical)]" />
      Live
    </span>
  );
}
