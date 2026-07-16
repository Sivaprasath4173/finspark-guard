/**
 * Alert Generator — produces Alert[] by correlating TelemetryEvents with
 * Transactions for the same user within a 90-minute proximity window.
 *
 * Entry points:
 *   buildDataset()    — generates the full initial synthetic dataset
 *   makeLiveEvent()   — creates a single streaming telemetry event
 *   makeLiveAlert()   — creates a correlated alert for a live event
 */
export {
  buildDataset,
  makeLiveEvent,
  makeLiveAlert,
} from "@/lib/trustlens-data";

export type { Dataset } from "@/lib/trustlens-data";
