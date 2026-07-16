/**
 * useSimulatedStream — injects a live TelemetryEvent every 8–12 seconds,
 * and with ~35% probability also produces a correlated Alert.
 *
 * This hook is consumed by TrustLensProvider (src/lib/trustlens-store.tsx).
 * It returns a callback to trigger the stream manually for testing.
 *
 * Usage:
 *   const { liveTick } = useSimulatedStream({ onEvent, onAlert });
 */
import { useEffect, useRef } from "react";
import { makeLiveAlert, makeLiveEvent } from "@/lib/trustlens-data";
import type { Alert, TelemetryEvent, User } from "@/types";

interface UseSimulatedStreamOptions {
  users: User[];
  onEvent: (event: TelemetryEvent) => void;
  onAlert: (alert: Alert) => void;
  onTick: () => void;
}

export function useSimulatedStream({
  users,
  onEvent,
  onAlert,
  onTick,
}: UseSimulatedStreamOptions) {
  const counter = useRef(0);

  useEffect(() => {
    let cancelled = false;

    const schedule = () => {
      // Randomise interval: 8–12 seconds to simulate organic telemetry cadence.
      const delay = 8_000 + Math.random() * 4_000;
      const id = setTimeout(() => {
        if (cancelled) return;

        counter.current += 1;
        const ev: TelemetryEvent = makeLiveEvent(users, counter.current);
        onEvent(ev);

        // ~35% chance of a correlated alert being generated from the event.
        if (Math.random() < 0.35) {
          const alert: Alert = makeLiveAlert(users, ev);
          onAlert(alert);
        }

        onTick();
        schedule();
      }, delay);
      return id;
    };

    const id = schedule();
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
