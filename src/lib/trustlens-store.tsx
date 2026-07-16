import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  buildDataset,
  makeLiveAlert,
  makeLiveEvent,
  type Alert,
  type AlertStatus,
  type Dataset,
  type TelemetryEvent,
} from "./trustlens-data";

interface TrustLensContextValue extends Dataset {
  updateAlertStatus: (id: string, status: AlertStatus) => void;
  liveTick: number;
}

const TrustLensContext = createContext<TrustLensContextValue | null>(null);

export function TrustLensProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Dataset>(() => buildDataset());
  const [liveTick, setLiveTick] = useState(0);
  const counter = useRef(0);

  useEffect(() => {
    let cancelled = false;
    const schedule = () => {
      const delay = 8000 + Math.random() * 4000;
      const id = setTimeout(() => {
        if (cancelled) return;
        counter.current += 1;
        setData((prev) => {
          const ev: TelemetryEvent = makeLiveEvent(prev.users, counter.current);
          const events = [ev, ...prev.events].slice(0, 400);
          // ~30% chance to also produce a correlated alert
          let alerts = prev.alerts;
          if (Math.random() < 0.35) {
            const alert: Alert = makeLiveAlert(prev.users, ev);
            alerts = [alert, ...alerts].slice(0, 80);
          }
          return { ...prev, events, alerts };
        });
        setLiveTick((t) => t + 1);
        schedule();
      }, delay);
      return id;
    };
    const id = schedule();
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, []);

  const value = useMemo<TrustLensContextValue>(
    () => ({
      ...data,
      liveTick,
      updateAlertStatus: (id, status) => {
        setData((prev) => ({
          ...prev,
          alerts: prev.alerts.map((a) => (a.id === id ? { ...a, status } : a)),
        }));
      },
    }),
    [data, liveTick],
  );

  return (
    <TrustLensContext.Provider value={value}>
      {children}
    </TrustLensContext.Provider>
  );
}

export function useTrustLens() {
  const ctx = useContext(TrustLensContext);
  if (!ctx) throw new Error("useTrustLens must be used inside TrustLensProvider");
  return ctx;
}

export function useUserLookup() {
  const { users } = useTrustLens();
  return useMemo(() => {
    const m = new Map<string, (typeof users)[number]>();
    for (const u of users) m.set(u.id, u);
    return m;
  }, [users]);
}
