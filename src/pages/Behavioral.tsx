import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import {
  Activity,
  Brain,
  Fingerprint,
  Info,
  Play,
  RotateCcw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { useTrustLens } from "@/lib/trustlens-store";
import {
  IsolationForest,
  generateUserBaseline,
  explainBehavioralRisk,
  featuresToArray,
  type BehavioralFeatures,
  type ExplanationResult,
} from "@/services/behavioralEngine";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface SimulatedLog extends ExplanationResult {
  id: string;
  timestamp: number;
  userId: string;
  userName: string;
  features: BehavioralFeatures;
}

export default function BehavioralPage() {
  const { users } = useTrustLens();

  // Active user selection
  const [selectedUserId, setSelectedUserId] = useState<string>(
    users[0]?.id || "u_000"
  );
  const activeUser = useMemo(() => {
    return users.find((u) => u.id === selectedUserId) || users[0];
  }, [users, selectedUserId]);

  // Generate historical baseline and train Isolation Forest
  const [baselineData, setBaselineData] = useState<BehavioralFeatures[]>([]);
  const [model, setModel] = useState<IsolationForest | null>(null);
  const [isTraining, setIsTraining] = useState(false);

  // Re-train when active user changes
  useEffect(() => {
    if (!activeUser) return;
    setIsTraining(true);
    // Short artificial delay to simulate real-time training animation
    const id = setTimeout(() => {
      const data = generateUserBaseline(activeUser, 100);
      setBaselineData(data);

      const forest = new IsolationForest(100);
      const trainingVectors = data.map(featuresToArray);
      forest.fit(trainingVectors);

      setModel(forest);
      setIsTraining(false);
      toast.success(`Isolation Forest retrained for ${activeUser.name}`, {
        description: "100 iTrees compiled on 100 baseline vectors.",
      });
    }, 400);

    return () => clearTimeout(id);
  }, [activeUser]);

  // Simulation Form State
  const [loginHour, setLoginHour] = useState<number>(14);
  const [deviceChange, setDeviceChange] = useState<boolean>(false);
  const [browserFingerprintMatch, setBrowserFingerprintMatch] = useState<boolean>(true);
  const [ipReputation, setIpReputation] = useState<number>(10);
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [sessionDuration, setSessionDuration] = useState<number>(15);
  const [locationMatch, setLocationMatch] = useState<boolean>(true);
  const [transactionAmount, setTransactionAmount] = useState<number>(180);
  const [transactionFrequency, setTransactionFrequency] = useState<number>(0.5);
  const [newBeneficiary, setNewBeneficiary] = useState<boolean>(false);

  // Set form to typical values for the user
  const handleResetToBaseline = () => {
    if (baselineData.length === 0) return;
    const sample = baselineData[0];
    setLoginHour(sample.loginHour);
    setDeviceChange(sample.deviceChange === 1);
    setBrowserFingerprintMatch(sample.browserFingerprintMatch === 1);
    setIpReputation(sample.ipReputation);
    setFailedAttempts(sample.failedAttempts);
    setSessionDuration(sample.sessionDuration);
    setLocationMatch(sample.locationMatch === 1);
    setTransactionAmount(sample.transactionAmount);
    setTransactionFrequency(sample.transactionFrequency);
    setNewBeneficiary(sample.newBeneficiary === 1);
    toast.message("Form reset to historical baseline typical values");
  };

  // Run initial reset to set form values
  useEffect(() => {
    if (baselineData.length > 0) {
      handleResetToBaseline();
    }
  }, [baselineData]);

  // Timeline list
  const [timeline, setTimeline] = useState<SimulatedLog[]>([]);

  // Current analysis results
  const currentFeatures: BehavioralFeatures = useMemo(() => {
    return {
      loginHour,
      deviceChange: deviceChange ? 1 : 0,
      browserFingerprintMatch: browserFingerprintMatch ? 1 : 0,
      ipReputation,
      failedAttempts,
      sessionDuration,
      locationMatch: locationMatch ? 1 : 0,
      transactionAmount,
      transactionFrequency,
      newBeneficiary: newBeneficiary ? 1 : 0,
    };
  }, [
    loginHour,
    deviceChange,
    browserFingerprintMatch,
    ipReputation,
    failedAttempts,
    sessionDuration,
    locationMatch,
    transactionAmount,
    transactionFrequency,
    newBeneficiary,
  ]);

  const currentResult: ExplanationResult = useMemo(() => {
    if (!model || baselineData.length === 0) {
      return {
        riskScore: 0,
        anomalyScore: 0,
        severity: "Low",
        reasons: [],
        recommendedAction: "Awaiting model compilation...",
      };
    }
    const x = featuresToArray(currentFeatures);
    const score = model.score(x);
    return explainBehavioralRisk(currentFeatures, baselineData, score);
  }, [model, currentFeatures, baselineData]);

  // Run analysis and log to timeline
  const handleRunAnalysis = () => {
    if (!model || !activeUser) return;
    
    const newLog: SimulatedLog = {
      ...currentResult,
      id: `sim_${Date.now()}`,
      timestamp: Date.now(),
      userId: activeUser.id,
      userName: activeUser.name,
      features: { ...currentFeatures },
    };

    setTimeline((prev) => [newLog, ...prev].slice(0, 10));

    if (newLog.severity === "Critical") {
      toast.error(`CRITICAL RISK: ${newLog.reasons[0] || "Suspicious anomaly detected"}`, {
        description: `Action: ${newLog.recommendedAction}`,
      });
    } else if (newLog.severity === "High") {
      toast.warning(`High Risk Activity Detected: ${newLog.reasons[0]}`, {
        description: `Action: ${newLog.recommendedAction}`,
      });
    } else {
      toast.success("Transaction evaluated as safe by Isolation Forest.");
    }
  };

  // Quick Preset buttons
  const applyPreset = (type: "normal" | "impossible_travel" | "high_amount" | "credential_stuffing") => {
    handleResetToBaseline();
    if (type === "impossible_travel") {
      setLocationMatch(false);
      setIpReputation(78);
      setLoginHour(3); // 3 AM
      toast.info("Applied Impossible Travel Preset");
    } else if (type === "high_amount") {
      // 12x higher than typical amount
      const multiplier = activeUser.tier === "Standard" ? 1500 : activeUser.tier === "Gold" ? 6500 : 45000;
      setTransactionAmount(multiplier);
      setNewBeneficiary(true);
      setSessionDuration(85);
      toast.info("Applied Atypical High-Amount Wire Preset");
    } else if (type === "credential_stuffing") {
      setFailedAttempts(4);
      setDeviceChange(true);
      setBrowserFingerprintMatch(false);
      toast.info("Applied Credential Stuffing / New Device Preset");
    }
  };

  // Baseline Recharts data
  const baselineRiskTrend = useMemo(() => {
    if (!model || baselineData.length === 0) return [];
    return baselineData.slice(0, 15).map((d, index) => {
      const score = model.score(featuresToArray(d));
      const res = explainBehavioralRisk(d, baselineData, score);
      return {
        sample: `Log-${index + 1}`,
        score: res.riskScore,
        anomaly: Math.round(res.anomalyScore * 100),
      };
    });
  }, [model, baselineData]);

  // Color mappings
  const colorMap = {
    Low: "var(--low)",
    Medium: "var(--medium)",
    High: "var(--high)",
    Critical: "var(--critical)",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
            <Fingerprint className="h-5 w-5 text-primary" />
            Behavioral Anomaly Detection
          </h1>
          <p className="text-sm text-muted-foreground">
            Continuous session & transaction compliance via client-side Isolation Forest classification.
          </p>
        </div>

        {/* User Selector Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Active Profile:</span>
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="h-9 rounded-md border border-border bg-card px-3 text-xs font-medium text-foreground outline-none focus:ring-1 focus:ring-primary/40 cursor-pointer"
          >
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.tier})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* ML Calibration & Score Display */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="border-border bg-card p-5 relative overflow-hidden flex flex-col justify-between min-h-[340px]">
            {isTraining && (
              <div className="absolute inset-0 z-10 bg-background/80 flex flex-col items-center justify-center backdrop-blur-sm">
                <Activity className="h-8 w-8 animate-spin text-primary mb-2" />
                <span className="text-xs font-medium">Re-indexing user baseline...</span>
              </div>
            )}

            <div>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Active Session Scoring</h3>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
                    User: {activeUser.name}
                  </p>
                </div>
                <div
                  className="rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset"
                  style={{
                    backgroundColor: `${colorMap[currentResult.severity]}15`,
                    color: colorMap[currentResult.severity],
                    borderColor: `${colorMap[currentResult.severity]}40`,
                  }}
                >
                  {currentResult.severity} Risk
                </div>
              </div>

              {/* Radial Dial */}
              <div className="relative flex items-center justify-center my-6">
                <svg className="w-36 h-36 transform -rotate-90">
                  <circle
                    cx="72"
                    cy="72"
                    r="60"
                    className="stroke-muted"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <circle
                    cx="72"
                    cy="72"
                    r="60"
                    stroke={colorMap[currentResult.severity]}
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={377}
                    strokeDashoffset={377 - (377 * currentResult.riskScore) / 100}
                    className="transition-all duration-500 ease-out"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="text-3xl font-bold font-mono tracking-tighter text-foreground">
                    {currentResult.riskScore}
                  </span>
                  <span className="text-xs text-muted-foreground block -mt-1">/100</span>
                </div>
              </div>
            </div>

            {/* Diagnostics Stats */}
            <div className="grid grid-cols-2 gap-2 text-center border-t border-border pt-4 mt-2">
              <div className="bg-muted/30 p-2 rounded">
                <span className="text-[10px] text-muted-foreground block uppercase">Trust Score</span>
                <span className="text-sm font-bold font-mono text-foreground">
                  {100 - currentResult.riskScore}%
                </span>
              </div>
              <div className="bg-muted/30 p-2 rounded">
                <span className="text-[10px] text-muted-foreground block uppercase">Anomaly Index</span>
                <span className="text-sm font-bold font-mono text-primary">
                  {currentResult.anomalyScore}
                </span>
              </div>
            </div>
          </Card>

          {/* Explainable AI Reasons Panel */}
          <Card className="border-border bg-card p-5 min-h-[220px] flex flex-col">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
              <Brain className="h-3.5 w-3.5 text-primary" />
              AI Explanation Panel
            </h3>

            <div className="flex-1 space-y-3">
              {currentResult.reasons.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground py-6">
                  <ShieldCheck className="h-8 w-8 text-[color:var(--low)] mb-2" />
                  <p className="text-xs">No anomalies detected. Session aligns perfectly with user baseline.</p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {currentResult.reasons.map((reason, idx) => (
                    <li key={idx} className="text-xs flex items-start gap-2 text-foreground/95">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Recommended Action Alert Box */}
            <div
              className="mt-4 p-3 rounded-lg border text-xs"
              style={{
                backgroundColor: `${colorMap[currentResult.severity]}10`,
                borderColor: `${colorMap[currentResult.severity]}25`,
              }}
            >
              <div className="font-semibold mb-1 flex items-center gap-1">
                <Shield className="h-3.5 w-3.5" style={{ color: colorMap[currentResult.severity] }} />
                Recommended Response Action
              </div>
              <p className="text-muted-foreground font-medium leading-relaxed">
                {currentResult.recommendedAction}
              </p>
            </div>
          </Card>
        </div>

        {/* Interactive Simulation Console */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-border bg-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3 mb-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Behavioral Simulation Console</h3>
                <p className="text-xs text-muted-foreground">
                  Simulate events and evaluate behavior against the Isolation Forest.
                </p>
              </div>

              {/* Quick Presets */}
              <div className="flex flex-wrap gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-[10px] px-2 border-border/80 bg-muted/20 hover:bg-muted"
                  onClick={handleResetToBaseline}
                >
                  <RotateCcw className="h-3 w-3 mr-1" /> Reset
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-[10px] px-2 text-[color:var(--high)] border-[color:var(--high)]/30 bg-[color:var(--high)]/5 hover:bg-[color:var(--high)]/15"
                  onClick={() => applyPreset("credential_stuffing")}
                >
                  Credential Stuffing
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-[10px] px-2 text-[color:var(--critical)] border-[color:var(--critical)]/30 bg-[color:var(--critical)]/5 hover:bg-[color:var(--critical)]/15"
                  onClick={() => applyPreset("impossible_travel")}
                >
                  Geo Travel Mismatch
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-[10px] px-2 text-primary border-primary/30 bg-primary/5 hover:bg-primary/15"
                  onClick={() => applyPreset("high_amount")}
                >
                  Wire Exploit
                </Button>
              </div>
            </div>

            {/* Parameter Inputs Grid */}
            <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2 text-xs">
              {/* Login Time Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-mono text-[11px]">
                  <span className="text-muted-foreground">Login Time:</span>
                  <span className="text-foreground font-semibold">
                    {loginHour.toString().padStart(2, "0")}:00
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="23"
                  value={loginHour}
                  onChange={(e) => setLoginHour(parseInt(e.target.value))}
                  className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              {/* Transaction Amount Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-mono text-[11px]">
                  <span className="text-muted-foreground">Transaction Amount:</span>
                  <span className="text-foreground font-semibold">
                    ${transactionAmount.toLocaleString()}
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max={activeUser.tier === "Private" ? 50000 : activeUser.tier === "Platinum" ? 15000 : 5000}
                  step="10"
                  value={transactionAmount}
                  onChange={(e) => setTransactionAmount(parseInt(e.target.value))}
                  className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              {/* Session Duration Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-mono text-[11px]">
                  <span className="text-muted-foreground">Session Duration:</span>
                  <span className="text-foreground font-semibold">{sessionDuration} minutes</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="180"
                  value={sessionDuration}
                  onChange={(e) => setSessionDuration(parseInt(e.target.value))}
                  className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              {/* IP Reputation Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-mono text-[11px]">
                  <span className="text-muted-foreground">IP Reputation Score:</span>
                  <span className="text-foreground font-semibold">{ipReputation}/100</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={ipReputation}
                  onChange={(e) => setIpReputation(parseInt(e.target.value))}
                  className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              {/* Failed Attempts Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-mono text-[11px]">
                  <span className="text-muted-foreground">Failed Login Attempts:</span>
                  <span className="text-foreground font-semibold">{failedAttempts}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5"
                  value={failedAttempts}
                  onChange={(e) => setFailedAttempts(parseInt(e.target.value))}
                  className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              {/* Transaction Frequency */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-mono text-[11px]">
                  <span className="text-muted-foreground">Transaction Frequency:</span>
                  <span className="text-foreground font-semibold">{transactionFrequency}/hr</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="15"
                  step="0.1"
                  value={transactionFrequency}
                  onChange={(e) => setTransactionFrequency(parseFloat(e.target.value))}
                  className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>
            </div>

            {/* Toggle Switches */}
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 mt-6 pt-4 border-t border-border/70 text-xs">
              <div className="flex items-center justify-between bg-muted/15 p-2.5 rounded-lg border border-border/50">
                <span className="text-muted-foreground">Home Geolocation</span>
                <input
                  type="checkbox"
                  checked={locationMatch}
                  onChange={(e) => setLocationMatch(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between bg-muted/15 p-2.5 rounded-lg border border-border/50">
                <span className="text-muted-foreground">Known Device</span>
                <input
                  type="checkbox"
                  checked={!deviceChange}
                  onChange={(e) => setDeviceChange(!e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between bg-muted/15 p-2.5 rounded-lg border border-border/50">
                <span className="text-muted-foreground">Fingerprint Match</span>
                <input
                  type="checkbox"
                  checked={browserFingerprintMatch}
                  onChange={(e) => setBrowserFingerprintMatch(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between bg-muted/15 p-2.5 rounded-lg border border-border/50">
                <span className="text-muted-foreground">New Beneficiary</span>
                <input
                  type="checkbox"
                  checked={newBeneficiary}
                  onChange={(e) => setNewBeneficiary(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                />
              </div>
            </div>

            {/* ML Core Trigger */}
            <div className="mt-5 flex justify-end">
              <Button onClick={handleRunAnalysis} disabled={!model} className="h-10 px-6 font-semibold flex items-center gap-2">
                <Play className="h-4 w-4" /> Run ML Analysis
              </Button>
            </div>
          </Card>

          {/* Model Health / Baseline Area Chart */}
          <Card className="border-border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Baseline Model Verification</h3>
                <p className="text-xs text-muted-foreground">
                  Expected Isolation Forest risk score variance across historical logs.
                </p>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary ring-1 ring-inset ring-primary/30">
                <Zap className="h-3 w-3" /> Model Active
              </div>
            </div>

            <div className="h-44 w-full text-xs">
              <ResponsiveContainer>
                <AreaChart data={baselineRiskTrend} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="2 4" vertical={false} />
                  <XAxis dataKey="sample" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: 6,
                    }}
                    labelStyle={{ color: "var(--muted-foreground)" }}
                  />
                  <Area type="monotone" dataKey="score" stroke="var(--primary)" strokeWidth={1.5} fill="url(#scoreGrad)" name="Baseline Risk" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>

      {/* Live Timeline & Recent Logs */}
      <Card className="border-border bg-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Anomaly Timeline</h3>
        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border pb-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="py-2.5 font-medium">User Profile</th>
                <th className="py-2.5 font-medium text-right">Risk score</th>
                <th className="py-2.5 font-medium text-center">Severity</th>
                <th className="py-2.5 font-medium">Primary Indicators</th>
                <th className="py-2.5 font-medium">Action Resolution</th>
                <th className="py-2.5 font-medium text-right">Execution time</th>
              </tr>
            </thead>
            <tbody>
              {timeline.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    <Info className="h-4 w-4 mx-auto mb-1.5 text-muted-foreground" />
                    No timeline records yet. Adjust sliders in the console and hit "Run ML Analysis".
                  </td>
                </tr>
              ) : (
                timeline.map((log) => (
                  <tr key={log.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="py-3">
                      <div className="font-semibold text-foreground">{log.userName}</div>
                      <div className="text-[10px] text-muted-foreground">{log.userId}</div>
                    </td>
                    <td className="py-3 text-right font-mono font-bold text-foreground pr-4">
                      {log.riskScore}/100
                    </td>
                    <td className="py-3 text-center">
                      <span
                        className="inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-semibold ring-1 ring-inset"
                        style={{
                          backgroundColor: `${colorMap[log.severity]}15`,
                          color: colorMap[log.severity],
                          borderColor: `${colorMap[log.severity]}30`,
                        }}
                      >
                        {log.severity}
                      </span>
                    </td>
                    <td className="py-3 max-w-[280px]">
                      {log.reasons.length === 0 ? (
                        <span className="text-[color:var(--low)] font-medium">Within baseline bounds</span>
                      ) : (
                        <div className="truncate text-muted-foreground" title={log.reasons.join(", ")}>
                          {log.reasons.join(", ")}
                        </div>
                      )}
                    </td>
                    <td className="py-3 font-medium text-muted-foreground max-w-[250px] truncate" title={log.recommendedAction}>
                      {log.recommendedAction}
                    </td>
                    <td className="py-3 text-right text-muted-foreground">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
