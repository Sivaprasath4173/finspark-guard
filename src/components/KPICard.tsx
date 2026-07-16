/**
 * KPICard — animated metric card used in the Overview dashboard.
 *
 * Flashes the value in primary colour whenever the `tick` prop increments,
 * giving a live-update visual cue.
 */
import { useEffect, useState } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

export interface KPICardProps {
  /** Lucide icon component to display in the top-right corner. */
  Icon: LucideIcon;
  /** Short label displayed above the value. */
  label: string;
  /** Formatted value string (e.g. "42", "$1,200", "4.2%"). */
  value: string;
  /** Trend delta shown below the value. */
  delta: { dir: "up" | "down"; text: string };
  /**
   * Increments whenever live data arrives — triggers a brief colour flash.
   * Omit for static KPIs.
   */
  tick?: number;
  /** When true, renders the icon in primary colour instead of muted. */
  accent?: boolean;
}

export function KPICard({ Icon, label, value, delta, tick, accent }: KPICardProps) {
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (tick === undefined) return;
    setFlash(true);
    const id = setTimeout(() => setFlash(false), 500);
    return () => clearTimeout(id);
  }, [tick]);

  // "down" is good for False-Positive Rate and Detection Time.
  const goodDown = label.includes("False") || label.includes("Detection");
  const positive = delta.dir === "up" ? !goodDown : goodDown;

  return (
    <Card className="border-border bg-card p-4 transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <Icon className={`h-4 w-4 ${accent ? "text-primary" : "text-muted-foreground"}`} />
      </div>
      <div
        className={`mt-2 text-2xl font-semibold tracking-tight tabular-nums transition-colors ${
          flash ? "text-primary" : "text-foreground"
        }`}
      >
        {value}
      </div>
      <div
        className={`mt-1 inline-flex items-center gap-1 text-xs ${
          positive ? "text-[color:var(--low)]" : "text-[color:var(--critical)]"
        }`}
      >
        {delta.dir === "up" ? (
          <ArrowUpRight className="h-3 w-3" />
        ) : (
          <ArrowDownRight className="h-3 w-3" />
        )}
        {delta.text}
      </div>
    </Card>
  );
}
