/**
 * QuantumBadge — inline badge flagging transactions that traverse legacy
 * RSA/ECDSA channels vulnerable to future quantum decryption.
 *
 * Renders nothing when `quantumRisk` is false so it is safe to render
 * unconditionally in table rows.
 */
import { ShieldQuestion } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface QuantumBadgeProps {
  /** When false the component renders null. */
  quantumRisk: boolean;
}

export function QuantumBadge({ quantumRisk }: QuantumBadgeProps) {
  if (!quantumRisk) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center gap-1 rounded-md bg-[color:var(--high)]/12 px-2 py-0.5 text-[11px] font-medium text-[color:var(--high)] ring-1 ring-inset ring-[color:var(--high)]/30">
          <ShieldQuestion className="h-3 w-3" />
          Quantum-Risk
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs border-border bg-popover text-xs">
        Flagged for post-quantum cryptographic risk assessment: transaction path
        traverses legacy RSA/ECDSA channels vulnerable to future quantum decryption.
      </TooltipContent>
    </Tooltip>
  );
}
