// Synthetic data + scoring for TrustLens demo.

export type Severity = "Critical" | "High" | "Medium" | "Low";
export type EventType =
  | "failed_login"
  | "new_device"
  | "tor_ip"
  | "impossible_travel"
  | "malware_beacon";
export type Channel = "online" | "POS" | "ATM" | "wire";
export type AlertStatus = "Open" | "Blocked" | "Verified" | "Dismissed";

export interface User {
  id: string;
  name: string;
  accountId: string;
  homeLocation: string;
  tier: "Standard" | "Gold" | "Platinum" | "Private";
}

export interface TelemetryEvent {
  id: string;
  type: EventType;
  userId: string;
  ip: string;
  device: string;
  location: string;
  severity: Severity;
  timestamp: number;
}

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  merchant: string;
  channel: Channel;
  location: string;
  timestamp: number;
  quantumRisk: boolean;
}

export interface Alert {
  id: string;
  userId: string;
  severity: Severity;
  riskScore: number;
  eventId: string;
  transactionId: string;
  triggeringEventType: EventType;
  amount: number;
  timestamp: number;
  status: AlertStatus;
  zScore: number;
  baselineMean: number;
  baselineStd: number;
  proximityMinutes: number;
}

// --- Deterministic PRNG so demo data is stable per session-ish ---
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(20260716);
const pick = <T,>(arr: T[]) => arr[Math.floor(rng() * arr.length)];
const randInt = (min: number, max: number) =>
  Math.floor(rng() * (max - min + 1)) + min;

const FIRST = ["Alex","Jordan","Priya","Marcus","Sofia","Yuki","Diego","Chen","Nadia","Ravi","Emma","Liam","Zara","Omar","Ines","Hana","Mateo","Aisha","Noah","Kai","Lena","Ivan","Farah","Julian","Talia","Sanjay","Elena","Theo","Amara","Kenji"];
const LAST = ["Reyes","Park","Nakamura","Silva","Khan","Ivanov","Chen","Okafor","Weiss","Torres","Kaur","Lopez","Bennett","Al-Fahim","Petrov","Kim","Rossi","Andersen","Baraka","Novak"];
const LOCATIONS = ["New York, US","London, UK","Berlin, DE","Singapore, SG","São Paulo, BR","Toronto, CA","Sydney, AU","Tokyo, JP","Mumbai, IN","Lagos, NG","Dubai, AE","Paris, FR","Amsterdam, NL","Mexico City, MX","Seoul, KR"];
const FOREIGN_LOCS = ["Pyongyang, KP","Tehran, IR","Minsk, BY","Caracas, VE","Vladivostok, RU","Karachi, PK","Lagos, NG"];
const MERCHANTS = ["Amazon","Apple Pay","Uber","Delta Airlines","Bloomingdale's","Wire Transfer","Bitfinex","Coinbase","Shell","Whole Foods","Best Buy","Netflix","Steam","Airbnb","Western Union","Nike","IKEA","Starbucks","Zara","Booking.com"];
const DEVICES = ["MacBook Pro (Chrome)","iPhone 15 (Safari)","Windows 11 (Edge)","Android (Chrome)","Linux (Firefox)","Unknown Device","iPad (Safari)"];
const CHANNELS: Channel[] = ["online","POS","ATM","wire"];
const EVENT_TYPES: EventType[] = ["failed_login","new_device","tor_ip","impossible_travel","malware_beacon"];

const EVENT_WEIGHTS: Record<EventType, number> = {
  failed_login: 1.2,
  new_device: 1.8,
  tor_ip: 2.6,
  impossible_travel: 2.9,
  malware_beacon: 3.2,
};

const EVENT_BASE_SEVERITY: Record<EventType, Severity> = {
  failed_login: "Low",
  new_device: "Medium",
  tor_ip: "High",
  impossible_travel: "High",
  malware_beacon: "Critical",
};

export const EVENT_LABEL: Record<EventType, string> = {
  failed_login: "Failed Login",
  new_device: "New Device",
  tor_ip: "Tor / VPN IP",
  impossible_travel: "Impossible Travel",
  malware_beacon: "Malware Beacon",
};

const randIp = () =>
  `${randInt(11,240)}.${randInt(0,255)}.${randInt(0,255)}.${randInt(1,254)}`;

const NOW = Date.now();

function buildUsers(n = 28): User[] {
  const users: User[] = [];
  for (let i = 0; i < n; i++) {
    const first = pick(FIRST);
    const last = pick(LAST);
    users.push({
      id: `u_${i.toString().padStart(3, "0")}`,
      name: `${first} ${last}`,
      accountId: `ACCT-${randInt(10000, 99999)}`,
      homeLocation: pick(LOCATIONS),
      tier: pick(["Standard","Standard","Standard","Gold","Gold","Platinum","Private"] as const),
    });
  }
  return users;
}

function buildTelemetry(users: User[], n = 180): TelemetryEvent[] {
  const events: TelemetryEvent[] = [];
  for (let i = 0; i < n; i++) {
    const type = pick(EVENT_TYPES);
    const user = pick(users);
    const foreign = type === "impossible_travel" || type === "tor_ip" || rng() < 0.15;
    events.push({
      id: `t_${i.toString().padStart(4, "0")}`,
      type,
      userId: user.id,
      ip: randIp(),
      device: pick(DEVICES),
      location: foreign ? pick(FOREIGN_LOCS) : user.homeLocation,
      severity: EVENT_BASE_SEVERITY[type],
      timestamp: NOW - randInt(0, 7 * 24 * 60) * 60_000,
    });
  }
  return events.sort((a, b) => b.timestamp - a.timestamp);
}

function buildTransactions(users: User[], n = 240): Transaction[] {
  const txs: Transaction[] = [];
  for (let i = 0; i < n; i++) {
    const user = pick(users);
    const channel = pick(CHANNELS);
    const big = rng() < 0.15;
    const amount = big
      ? randInt(3000, 45000) + rng()
      : randInt(15, 900) + rng();
    txs.push({
      id: `x_${i.toString().padStart(4, "0")}`,
      userId: user.id,
      amount: Math.round(amount * 100) / 100,
      merchant: pick(MERCHANTS),
      channel,
      location: rng() < 0.85 ? user.homeLocation : pick(LOCATIONS),
      timestamp: NOW - randInt(0, 7 * 24 * 60) * 60_000,
      quantumRisk: channel === "wire" ? rng() < 0.55 : rng() < 0.08,
    });
  }
  return txs.sort((a, b) => b.timestamp - a.timestamp);
}

const BASELINE_MEAN = 240; // typical txn amount
const BASELINE_STD = 180;

export function scoreCorrelation(
  ev: TelemetryEvent,
  tx: Transaction,
): { risk: number; z: number; proximityMin: number } | null {
  const proximityMs = Math.abs(ev.timestamp - tx.timestamp);
  const proximityMin = proximityMs / 60_000;
  if (proximityMin > 90) return null;
  const z = (tx.amount - BASELINE_MEAN) / BASELINE_STD;
  
  const baseScoreMap: Record<EventType, number> = {
    failed_login: 30,
    new_device: 40,
    tor_ip: 50,
    impossible_travel: 55,
    malware_beacon: 65,
  };
  const base = baseScoreMap[ev.type];
  const zContribution = z > 0 ? Math.min(24, Math.log1p(z) * 6) : 0;
  const proximityBonus = Math.max(0, (90 - proximityMin) / 90) * 10;
  
  const raw = base + zContribution + proximityBonus;
  const risk = Math.max(35, Math.min(99, Math.round(raw)));
  return { risk, z, proximityMin };
}

function severityFromScore(score: number): Severity {
  if (score >= 82) return "Critical";
  if (score >= 65) return "High";
  if (score >= 45) return "Medium";
  return "Low";
}

function buildAlerts(
  users: User[],
  events: TelemetryEvent[],
  txs: Transaction[],
): Alert[] {
  const txByUser = new Map<string, Transaction[]>();
  for (const t of txs) {
    if (!txByUser.has(t.userId)) txByUser.set(t.userId, []);
    txByUser.get(t.userId)!.push(t);
  }
  const candidates: Alert[] = [];
  for (const ev of events) {
    const userTx = txByUser.get(ev.userId) ?? [];
    for (const tx of userTx) {
      const s = scoreCorrelation(ev, tx);
      if (!s) continue;
      candidates.push({
        id: `a_${candidates.length.toString().padStart(4, "0")}`,
        userId: ev.userId,
        severity: severityFromScore(s.risk),
        riskScore: s.risk,
        eventId: ev.id,
        transactionId: tx.id,
        triggeringEventType: ev.type,
        amount: tx.amount,
        timestamp: Math.max(ev.timestamp, tx.timestamp),
        status: "Open",
        zScore: Math.round(s.z * 100) / 100,
        baselineMean: BASELINE_MEAN,
        baselineStd: BASELINE_STD,
        proximityMinutes: Math.round(s.proximityMin * 10) / 10,
      });
    }
  }
  candidates.sort((a, b) => b.riskScore - a.riskScore);
  const top = candidates.slice(0, 18);
  return top.sort((a, b) => b.timestamp - a.timestamp);
}

export interface Dataset {
  users: User[];
  events: TelemetryEvent[];
  transactions: Transaction[];
  alerts: Alert[];
}

export function buildDataset(): Dataset {
  const users = buildUsers();
  const events = buildTelemetry(users);
  const transactions = buildTransactions(users);
  const alerts = buildAlerts(users, events, transactions);
  return { users, events, transactions, alerts };
}

export function makeLiveEvent(users: User[], id: number): TelemetryEvent {
  const type = pick(EVENT_TYPES);
  const user = pick(users);
  const foreign = rng() < 0.35;
  return {
    id: `tl_${id}_${Date.now()}`,
    type,
    userId: user.id,
    ip: randIp(),
    device: pick(DEVICES),
    location: foreign ? pick(FOREIGN_LOCS) : user.homeLocation,
    severity: EVENT_BASE_SEVERITY[type],
    timestamp: Date.now(),
  };
}

export function makeLiveAlert(
  users: User[],
  ev: TelemetryEvent,
): Alert {
  const amount = Math.round((randInt(500, 12000) + rng()) * 100) / 100;
  const z = (amount - BASELINE_MEAN) / BASELINE_STD;
  
  const baseScoreMap: Record<EventType, number> = {
    failed_login: 30,
    new_device: 40,
    tor_ip: 50,
    impossible_travel: 55,
    malware_beacon: 65,
  };
  const base = baseScoreMap[ev.type];
  const zContribution = z > 0 ? Math.min(24, Math.log1p(z) * 6) : 0;
  const proximityMin = Math.round(rng() * 40 * 10) / 10;
  const proximityBonus = Math.max(0, (90 - proximityMin) / 90) * 10;
  
  const risk = Math.max(35, Math.min(99, Math.round(base + zContribution + proximityBonus)));
  return {
    id: `al_${Date.now()}`,
    userId: ev.userId,
    severity: severityFromScore(risk),
    riskScore: risk,
    eventId: ev.id,
    transactionId: `x_live_${Date.now()}`,
    triggeringEventType: ev.type,
    amount,
    timestamp: Date.now(),
    status: "Open",
    zScore: Math.round(z * 100) / 100,
    baselineMean: BASELINE_MEAN,
    baselineStd: BASELINE_STD,
    proximityMinutes: proximityMin,
  } as Alert;
}

// AI-style explanation (template-based, contextual)
export function explainAlert(alert: Alert, user: User | undefined): string[] {
  const loc = user?.homeLocation ?? "the account's home region";
  const evtLabel = EVENT_LABEL[alert.triggeringEventType];
  const amountStr = `$${alert.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  const window = `${alert.proximityMinutes} min`;
  const sev = alert.severity;

  const line1Options: Record<EventType, string> = {
    failed_login: `A burst of failed login attempts preceded a ${amountStr} transaction on ${user?.name ?? "this account"}, ${window} apart.`,
    new_device: `Sign-in from an unrecognized device was followed by a ${amountStr} transaction within a ${window} window.`,
    tor_ip: `Session originated from a known Tor/VPN exit node just ${window} before a ${amountStr} transaction cleared.`,
    impossible_travel: `Geo-impossible session was observed ${window} before a ${amountStr} transaction on the same account, inconsistent with ${loc}.`,
    malware_beacon: `Endpoint beaconing to a known malware C2 was detected ${window} before a ${amountStr} transaction was authorized.`,
  };

  const line2 = `The composite z-score is ${alert.zScore.toFixed(2)} against a baseline of $${alert.baselineMean}±${alert.baselineStd}, and the ${evtLabel} weight combined with the ${window} proximity pushes correlation confidence to ${alert.riskScore}/100.`;

  const line3Options: Record<Severity, string> = {
    Critical: `Recommended action: block the transaction, freeze the session, and page the on-call fraud responder immediately.`,
    High: `Recommended action: hold the transaction, force step-up MFA, and escalate to Tier-2 for verification within 5 minutes.`,
    Medium: `Recommended action: challenge the user with step-up authentication and monitor the next 30 minutes of activity.`,
    Low: `Recommended action: log for pattern learning and notify the user of the unusual sign-in to close the loop.`,
  };

  return [line1Options[alert.triggeringEventType], line2, line3Options[sev]];
}

export function formatRelative(ts: number, now = Date.now()): string {
  const s = Math.floor((now - ts) / 1000);
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function riskTrend(alerts: Alert[]): { day: string; risk: number; alerts: number }[] {
  const days: { day: string; risk: number; alerts: number }[] = [];
  const now = Date.now();
  for (let i = 6; i >= 0; i--) {
    const start = now - i * 24 * 60 * 60_000;
    const end = start + 24 * 60 * 60_000;
    const bucket = alerts.filter((a) => a.timestamp >= start - 24 * 60 * 60_000 && a.timestamp <= end);
    const avg =
      bucket.length === 0
        ? 20 + Math.round(Math.random() * 10)
        : Math.round(
            bucket.reduce((acc, a) => acc + a.riskScore, 0) / bucket.length,
          );
    const d = new Date(start);
    days.push({
      day: d.toLocaleDateString(undefined, { weekday: "short" }),
      risk: avg,
      alerts: bucket.length,
    });
  }
  return days;
}

export const SEVERITY_ORDER: Severity[] = ["Critical", "High", "Medium", "Low"];
