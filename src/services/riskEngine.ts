/**
 * Risk Engine — z-score + event-weight correlation scoring.
 *
 * Composite risk score formula:
 *   risk = clamp(4, 99, eventWeight × 12 + max(0, z) × 10 + proximityBonus)
 *
 * where:
 *   z             = (txAmount − baselineMean) / baselineStd
 *   proximityBonus = max(0, (90 − proximityMinutes) / 90) × 25
 *   eventWeight   — per-event multiplier (1.2 – 3.2)
 */
export {
  scoreCorrelation,
  SEVERITY_ORDER,
} from "@/lib/trustlens-data";

// Baseline constants exposed for transparency / unit-test access.
export const BASELINE_MEAN = 240; // USD
export const BASELINE_STD = 180; // USD

/**
 * Map raw risk score (0–100) to a human-readable severity label.
 * Thresholds mirror those used in trustlens-data.ts.
 */
export function severityFromScore(
  score: number,
): "Critical" | "High" | "Medium" | "Low" {
  if (score >= 82) return "Critical";
  if (score >= 65) return "High";
  if (score >= 45) return "Medium";
  return "Low";
}

/**
 * Per-event-type weight multipliers used in the composite risk formula.
 */
export const EVENT_WEIGHTS = {
  failed_login: 1.2,
  new_device: 1.8,
  tor_ip: 2.6,
  impossible_travel: 2.9,
  malware_beacon: 3.2,
} as const;
