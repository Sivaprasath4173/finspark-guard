import { useMemo, useState } from "react";
import { ShieldCheck, ShieldAlert, Cpu, HelpCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatRelative, type Channel } from "@/lib/trustlens-data";
import { useTrustLens, useUserLookup } from "@/lib/trustlens-store";

const CHANNELS: (Channel | "all")[] = ["all", "online", "POS", "ATM", "wire"];

export default function TransactionsPage() {
  const { transactions, pqcActive, setPqcActive } = useTrustLens();
  const users = useUserLookup();
  const [ch, setCh] = useState<Channel | "all">("all");

  const filtered = useMemo(
    () => (ch === "all" ? transactions : transactions.filter((t) => t.channel === ch)),
    [transactions, ch],
  );

  return (
    <TooltipProvider delayDuration={100}>
      <div className="space-y-4">
        {/* Dynamic Hackathon control panel - PQC Upgrade Sentinel */}
        <Card className={`border-l-4 p-4 transition-all duration-300 ${
          pqcActive 
            ? "border-[color:var(--low)] bg-gradient-to-tr from-card to-[color:var(--low)]/5" 
            : "border-[color:var(--high)] bg-gradient-to-tr from-card to-[color:var(--high)]/5"
        }`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1 max-w-xl">
              <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                pqcActive 
                  ? "bg-[color:var(--low)]/10 text-[color:var(--low)]" 
                  : "bg-[color:var(--high)]/10 text-[color:var(--high)]"
              }`}>
                {pqcActive ? <ShieldCheck className="h-3.5 w-3.5" /> : <ShieldAlert className="h-3.5 w-3.5" />}
                {pqcActive ? "Post-Quantum Cryptography Active" : "Legacy Cryptography Vulnerability Detected"}
              </div>
              <h2 className="text-sm font-semibold text-foreground">Post-Quantum Migration Sentinel</h2>
              <p className="text-xs text-muted-foreground">
                Threat vector assessment: Adversaries can harvest RSA/ECDSA transaction ciphertexts today to decrypt them later when quantum computers scale (Harvest Now, Decrypt Later).
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-semibold text-foreground">
                  {pqcActive ? "ML-KEM (Kyber-1024) Tunnels Active" : "Vulnerable Legacy RSA/ECDSA"}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {pqcActive ? "Safe against Shor's algorithm" : "Susceptible to decryption"}
                </div>
              </div>
              
              <button
                onClick={() => setPqcActive(!pqcActive)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  pqcActive ? "bg-[color:var(--accent)]" : "bg-muted"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow ring-0 transition duration-200 ease-in-out ${
                    pqcActive ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </Card>

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
                      <td className="px-3 py-2.5 text-muted-foreground">{formatRelative(tx.timestamp)}</td>
                      <td className="px-3 py-2.5">
                        {tx.quantumRisk ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex items-center gap-1 rounded-md bg-[color:var(--high)]/12 px-2 py-0.5 text-[11px] font-medium text-[color:var(--high)] ring-1 ring-inset ring-[color:var(--high)]/30">
                                <HelpCircle className="h-3 w-3" />
                                Quantum-Risk (Legacy RSA)
                              </span>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs border-border bg-popover text-xs">
                              Flagged for cryptographic risk: Vulnerable to Harvest Now, Decrypt Later (HNDL) attacks.
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-md bg-[color:var(--low)]/12 px-2 py-0.5 text-[11px] font-medium text-[color:var(--low)] ring-1 ring-inset ring-[color:var(--low)]/30">
                            <Cpu className="h-3 w-3" />
                            PQ-Secure (ML-KEM)
                          </span>
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
