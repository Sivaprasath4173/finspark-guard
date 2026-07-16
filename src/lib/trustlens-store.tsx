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
  // Dynamic Hackathon Controls
  zThreshold: number;
  setZThreshold: (z: number) => void;
  timeWindow: number;
  setTimeWindow: (minutes: number) => void;
  pqcActive: boolean;
  setPqcActive: (active: boolean) => void;
}

const TrustLensContext = createContext<TrustLensContextValue | null>(null);

export function TrustLensProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Dataset>(() => buildDataset());
  const [liveTick, setLiveTick] = useState(0);
  const counter = useRef(0);

  // Hackathon State
  const [zThreshold, setZThreshold] = useState(1.2);
  const [timeWindow, setTimeWindow] = useState(90);
  const [pqcActive, setPqcActive] = useState(false);

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

  // Filter alerts & transactions based on tuning parameters
  const filteredData = useMemo(() => {
    let baseAlerts = data.alerts;
    
    // Filter alerts by dynamically matching Z-Score and Proximity window
    baseAlerts = baseAlerts.filter(
      (a) => Math.abs(a.zScore) >= zThreshold && a.proximityMinutes <= timeWindow
    );

    // If PQC active, adjust quantum risks to false (all migration completed)
    const baseTransactions = data.transactions.map((tx) => ({
      ...tx,
      quantumRisk: pqcActive ? false : tx.quantumRisk,
    }));

    return {
      ...data,
      alerts: baseAlerts,
      transactions: baseTransactions,
    };
  }, [data, zThreshold, timeWindow, pqcActive]);

  const value = useMemo<TrustLensContextValue>(
    () => ({
      ...filteredData,
      liveTick,
      zThreshold,
      setZThreshold,
      timeWindow,
      setTimeWindow,
      pqcActive,
      setPqcActive,
      updateAlertStatus: (id, status) => {
        setData((prev) => ({
          ...prev,
          alerts: prev.alerts.map((a) => (a.id === id ? { ...a, status } : a)),
        }));
      },
    }),
    [filteredData, liveTick, zThreshold, timeWindow, pqcActive]
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
