import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Ban, Check, Sparkles, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { EventIcon, SeverityChip } from "./severity";
import { EVENT_LABEL, type Alert } from "@/lib/trustlens-data";
import { useTrustLens, useUserLookup } from "@/lib/trustlens-store";
import { explainAlertAI } from "@/services/explainAI";
import { Input } from "@/components/ui/input";

export function AlertDetailModal({
  alert,
  open,
  onOpenChange,
}: {
  alert: Alert | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { events, transactions, updateAlertStatus } = useTrustLens();
  const users = useUserLookup();

  // Dynamic state for real-time Gemini requests
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState<string[]>([]);
  const [source, setSource] = useState<string>("Local Correlation Model");
  const [customKey, setCustomKey] = useState("");
  const [showKeyInput, setShowKeyInput] = useState(false);

  const user = alert ? users.get(alert.userId) : undefined;
  const ev = alert ? events.find((e) => e.id === alert.eventId) : undefined;
  const tx = alert ? transactions.find((t) => t.id === alert.transactionId) : undefined;

  // Request the briefing from Gemini whenever modal opens or custom key changes
  useEffect(() => {
    if (!alert || !open) return;

    let active = true;
    async function loadBriefing() {
      setLoading(true);
      const res = await explainAlertAI(alert!, user, customKey);
      if (active) {
        setExplanation(res.text);
        setSource(res.source);
        setLoading(false);
      }
    }

    loadBriefing();
    return () => {
      active = false;
    };
  }, [alert, open, user, customKey]);

  if (!alert) return null;

  const act = (status: "Blocked" | "Verified" | "Dismissed") => {
    updateAlertStatus(alert.id, status);
    const map = {
      Blocked: { title: "Transaction blocked", desc: "Session frozen and case escalated." },
      Verified: { title: "Verified as legitimate", desc: "User will be notified." },
      Dismissed: { title: "Alert dismissed", desc: "Marked as false positive for model retraining." },
    } as const;
    toast[status === "Blocked" ? "error" : status === "Verified" ? "success" : "message"](
      map[status].title,
      { description: map[status].desc }
    );
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl border-border bg-card p-0 sm:rounded-xl">
        <DialogTitle className="sr-only">Alert {alert.id}</DialogTitle>
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div className="flex items-center gap-3">
            <SeverityChip severity={alert.severity} />
            <div>
              <div className="text-sm font-semibold">
                {user?.name ?? alert.userId} · {EVENT_LABEL[alert.triggeringEventType]}
              </div>
              <div className="text-xs text-muted-foreground">
                Alert {alert.id} · Risk {alert.riskScore}/100
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-0 md:grid-cols-2">
          {/* Raw data */}
          <div className="space-y-4 border-b border-border p-5 md:border-b-0 md:border-r">
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Triggering Telemetry
              </h3>
              <div className="space-y-2 rounded-lg border border-border bg-[color:var(--surface-2)]/60 p-3 text-xs">
                <Row label="Type">
                  <span className="inline-flex items-center gap-2">
                    {ev && <EventIcon type={ev.type} />}
                    {ev ? EVENT_LABEL[ev.type] : "—"}
                  </span>
                </Row>
                <Row label="IP">{ev?.ip ?? "—"}</Row>
                <Row label="Device">{ev?.device ?? "—"}</Row>
                <Row label="Location">{ev?.location ?? "—"}</Row>
                <Row label="Timestamp">
                  {ev ? new Date(ev.timestamp).toLocaleString() : "—"}
                </Row>
              </div>
            </section>

            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Correlated Transaction
              </h3>
              <div className="space-y-2 rounded-lg border border-border bg-[color:var(--surface-2)]/60 p-3 text-xs">
                <Row label="Amount">
                  <span className="tabular-nums font-medium text-foreground">
                    ${alert.amount.toLocaleString()}
                  </span>
                </Row>
                <Row label="Merchant">{tx?.merchant ?? "—"}</Row>
                <Row label="Channel">{tx?.channel ?? "—"}</Row>
                <Row label="Location">{tx?.location ?? "—"}</Row>
                <Row label="Timestamp">
                  {tx ? new Date(tx.timestamp).toLocaleString() : "—"}
                </Row>
              </div>
            </section>

            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Z-Score Breakdown
              </h3>
              <div className="rounded-lg border border-border bg-[color:var(--surface-2)]/60 p-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
                <div>
                  baseline μ ={" "}
                  <span className="text-foreground">$240</span>
                  {"  "}σ = <span className="text-foreground">$180</span>
                </div>
                <div>
                  z = (${alert.amount.toFixed(0)} − $240) / $180 ={" "}
                  <span className="text-foreground">{alert.zScore.toFixed(2)}</span>
                </div>
                <div>
                  proximity =
                  <span className="text-foreground"> {alert.proximityMinutes} min</span>
                </div>
                <div>
                  event weight · z · proximity →{" "}
                  <span className="text-primary">risk {alert.riskScore}/100</span>
                </div>
              </div>
            </section>
          </div>

          {/* AI panel */}
          <div className="flex flex-col p-5">
            <div className="mb-3 flex items-center gap-2">
              <div className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-primary/15 text-primary ring-1 ring-inset ring-primary/30 animate-pulse">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <div className="text-sm font-semibold">AI Analysis</div>
              <span className="ml-auto text-[10px] uppercase tracking-wider text-muted-foreground">
                {source}
              </span>
            </div>

            {loading ? (
              <div className="flex flex-1 flex-col items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                <span className="text-xs">Generating threat brief...</span>
              </div>
            ) : (
              <div className="space-y-3 rounded-lg border border-border bg-gradient-to-b from-primary/8 to-transparent p-4 text-sm leading-relaxed text-foreground/90 flex-1">
                {explanation.map((line, i) => (
                  <p key={i}>
                    <span className="mr-2 text-xs font-semibold text-primary">
                      {i + 1}.
                    </span>
                    {line}
                  </p>
                ))}
              </div>
            )}

            {/* Custom Gemini Key Injection for Hackathon Demos */}
            <div className="mt-3">
              {showKeyInput ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="password"
                    placeholder="Enter Gemini API Key..."
                    className="h-8 text-xs border-border bg-muted/40"
                    value={customKey}
                    onChange={(e) => setCustomKey(e.target.value)}
                  />
                  <Button
                    size="sm"
                    className="h-8 px-2 text-xs"
                    onClick={() => setShowKeyInput(false)}
                  >
                    Done
                  </Button>
                </div>
              ) : (
                <button
                  onClick={() => setShowKeyInput(true)}
                  className="text-[10px] text-muted-foreground/80 hover:text-primary transition-colors underline"
                >
                  Configure custom Gemini API Key
                </button>
              )}
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              <Button
                onClick={() => act("Blocked")}
                className="bg-[color:var(--critical)] text-white hover:bg-[color:var(--critical)]/90"
              >
                <Ban className="mr-1.5 h-3.5 w-3.5" /> Block
              </Button>
              <Button
                onClick={() => act("Verified")}
                variant="secondary"
                className="border border-border"
              >
                <Check className="mr-1.5 h-3.5 w-3.5" /> Verify
              </Button>
              <Button
                onClick={() => act("Dismissed")}
                variant="ghost"
                className="border border-border"
              >
                Dismiss
              </Button>
            </div>

            <div className="mt-3 text-[11px] text-muted-foreground flex justify-between">
              <span>Status: <span className="text-foreground">{alert.status}</span></span>
              {source.includes("Gemini") && <span className="text-primary font-medium">Verified PQC Analysis</span>}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right text-foreground">{children}</span>
    </div>
  );
}
