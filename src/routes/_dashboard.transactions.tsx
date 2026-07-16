import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ShieldQuestion } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatRelative, type Channel } from "@/lib/trustlens-data";
import { useTrustLens, useUserLookup } from "@/lib/trustlens-store";

export const Route = createFileRoute("/_dashboard/transactions")({
  head: () => ({
    meta: [
      { title: "Transactions — TrustLens" },
      { name: "description", content: "Banking transactions ingested and correlated by TrustLens, including post-quantum crypto risk flags." },
    ],
  }),
  component: TransactionsPage,
});

const CHANNELS: (Channel | "all")[] = ["all", "online", "POS", "ATM", "wire"];

function TransactionsPage() {
  const { transactions } = useTrustLens();
  const users = useUserLookup();
  const [ch, setCh] = useState<Channel | "all">("all");

  const filtered = useMemo(
    () => (ch === "all" ? transactions : transactions.filter((t) => t.channel === ch)),
    [transactions, ch],
  );

  return (
    <TooltipProvider delayDuration={100}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Transactions</h1>
            <p className="text-sm text-muted-foreground">
              {filtered.length} ingested · past 7 days
            </p>
          </div>
          <Select value={ch} onValueChange={(v) => setCh(v as Channel | "all")}>
            <SelectTrigger className="h-9 w-40 border-border/70 bg-muted/40 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CHANNELS.map((c) => (
                <SelectItem key={c} value={c}>
                  {c === "all" ? "All channels" : c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Card className="border-border bg-card p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-3 py-2 font-medium">User</th>
                  <th className="px-3 py-2 text-right font-medium">Amount</th>
                  <th className="px-3 py-2 font-medium">Merchant</th>
                  <th className="px-3 py-2 font-medium">Channel</th>
                  <th className="px-3 py-2 font-medium">Location</th>
                  <th className="px-3 py-2 font-medium">Time</th>
                  <th className="px-3 py-2 font-medium">Flags</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 100).map((tx) => {
                  const u = users.get(tx.userId);
                  return (
                    <tr key={tx.id} className="border-b border-border/60 hover:bg-muted/40">
                      <td className="px-3 py-2.5">
                        <div className="font-medium">{u?.name ?? tx.userId}</div>
                        <div className="text-xs text-muted-foreground">{u?.accountId}</div>
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums font-medium">
                        ${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-3 py-2.5">{tx.merchant}</td>
                      <td className="px-3 py-2.5">
                        <span className="inline-flex rounded-md bg-muted px-2 py-0.5 text-[11px] uppercase tracking-wider text-muted-foreground ring-1 ring-inset ring-border">
                          {tx.channel}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">{tx.location}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">
                        {formatRelative(tx.timestamp)}
                      </td>
                      <td className="px-3 py-2.5">
                        {tx.quantumRisk && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex items-center gap-1 rounded-md bg-[color:var(--high)]/12 px-2 py-0.5 text-[11px] font-medium text-[color:var(--high)] ring-1 ring-inset ring-[color:var(--high)]/30">
                                <ShieldQuestion className="h-3 w-3" />
                                Quantum-Risk
                              </span>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs border-border bg-popover text-xs">
                              Flagged for post-quantum cryptographic risk assessment: transaction path traverses legacy RSA/ECDSA channels vulnerable to future quantum decryption.
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </TooltipProvider>
  );
}
