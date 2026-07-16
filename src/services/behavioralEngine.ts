/**
 * Behavioral Anomaly Detection Engine
 * 
 * Implements a pure client-side Isolation Forest machine learning model in TypeScript,
 * dynamic normal baseline generators, and statistical explainable AI diagnostic engines.
 */

import { type User } from "@/lib/trustlens-data";

export interface BehavioralFeatures {
  loginHour: number;            // 0 - 23
  deviceChange: number;          // 0 or 1
  browserFingerprintMatch: number;// 0 or 1 (1 = matched history, 0 = mismatch)
  ipReputation: number;         // 0 - 100 (higher = riskier/bad reputation)
  failedAttempts: number;       // 0 - 5
  sessionDuration: number;      // minutes (1 - 180)
  locationMatch: number;        // 0 or 1 (1 = home location, 0 = mismatch)
  transactionAmount: number;    // USD
  transactionFrequency: number; // transactions per hour
  newBeneficiary: number;       // 0 or 1
}

export function featuresToArray(f: BehavioralFeatures): number[] {
  return [
    f.loginHour,
    f.deviceChange,
    f.browserFingerprintMatch,
    f.ipReputation,
    f.failedAttempts,
    f.sessionDuration,
    f.locationMatch,
    f.transactionAmount,
    f.transactionFrequency,
    f.newBeneficiary,
  ];
}

// Isolation Forest Types
interface ITreeNode {
  size: number;
  splitFeature?: number;
  splitValue?: number;
  left?: ITreeNode;
  right?: ITreeNode;
}

// Average search path length in a Binary Search Tree for n points
function c(n: number): number {
  if (n <= 1) return 0;
  if (n === 2) return 1;
  const eulerGamma = 0.5772156649;
  return 2 * (Math.log(n - 1) + eulerGamma) - (2 * (n - 1) / n);
}

// Grow isolation tree recursively
function buildTree(X: number[][], currentHeight: number, maxHeight: number): ITreeNode {
  if (currentHeight >= maxHeight || X.length <= 1) {
    return { size: X.length };
  }

  const numFeatures = X[0].length;
  const validFeatures: number[] = [];
  const minMaxMap: Record<number, [number, number]> = {};

  for (let f = 0; f < numFeatures; f++) {
    let min = X[0][f];
    let max = X[0][f];
    for (let i = 1; i < X.length; i++) {
      if (X[i][f] < min) min = X[i][f];
      if (X[i][f] > max) max = X[i][f];
    }
    if (min !== max) {
      validFeatures.push(f);
      minMaxMap[f] = [min, max];
    }
  }

  if (validFeatures.length === 0) {
    return { size: X.length };
  }

  // Choose a random feature
  const q = validFeatures[Math.floor(Math.random() * validFeatures.length)];
  const [min, max] = minMaxMap[q];
  // Split randomly between min and max
  const p = min + Math.random() * (max - min);

  const leftX: number[][] = [];
  const rightX: number[][] = [];
  for (let i = 0; i < X.length; i++) {
    if (X[i][q] < p) {
      leftX.push(X[i]);
    } else {
      rightX.push(X[i]);
    }
  }

  return {
    size: X.length,
    splitFeature: q,
    splitValue: p,
    left: buildTree(leftX, currentHeight + 1, maxHeight),
    right: buildTree(rightX, currentHeight + 1, maxHeight),
  };
}

// Compute path length of a point in a tree
function pathLength(x: number[], node: ITreeNode, currentDepth: number): number {
  if (!node.left || !node.right || node.splitFeature === undefined || node.splitValue === undefined) {
    return currentDepth + c(node.size);
  }
  const q = node.splitFeature;
  const p = node.splitValue;
  if (x[q] < p) {
    return pathLength(x, node.left, currentDepth + 1);
  } else {
    return pathLength(x, node.right, currentDepth + 1);
  }
}

export class IsolationForest {
  trees: ITreeNode[] = [];
  sampleSize = 256;
  numTrees: number;

  constructor(numTrees = 100) {
    this.numTrees = numTrees;
  }

  fit(X: number[][]) {
    this.trees = [];
    const n = X.length;
    if (n === 0) return;
    this.sampleSize = Math.min(n, 128);
    const maxHeight = Math.ceil(Math.log2(this.sampleSize));

    for (let i = 0; i < this.numTrees; i++) {
      const sample: number[][] = [];
      const usedIndices = new Set<number>();
      // Sample without replacement
      while (sample.length < this.sampleSize && usedIndices.size < n) {
        const idx = Math.floor(Math.random() * n);
        if (!usedIndices.has(idx)) {
          usedIndices.add(idx);
          sample.push(X[idx]);
        }
      }
      this.trees.push(buildTree(sample, 0, maxHeight));
    }
  }

  score(x: number[]): number {
    if (this.trees.length === 0) return 0.5;
    let sumPath = 0;
    for (const tree of this.trees) {
      sumPath += pathLength(x, tree, 0);
    }
    const avgPath = sumPath / this.trees.length;
    const cVal = c(this.sampleSize);
    if (cVal === 0) return 0.5;
    return Math.pow(2, -avgPath / cVal);
  }
}

/**
 * Generates normal historical behavioral data points for a user to train the Isolation Forest.
 */
export function generateUserBaseline(user: User, size = 100): BehavioralFeatures[] {
  const baseline: BehavioralFeatures[] = [];
  
  // Custom baseline stats depending on user tier
  let amountMean = 150;
  let amountStd = 60;
  let freqMean = 0.4; // tx per hour

  if (user.tier === "Gold") {
    amountMean = 450;
    amountStd = 180;
    freqMean = 0.6;
  } else if (user.tier === "Platinum") {
    amountMean = 1800;
    amountStd = 600;
    freqMean = 0.8;
  } else if (user.tier === "Private") {
    amountMean = 8500;
    amountStd = 2500;
    freqMean = 1.2;
  }

  for (let i = 0; i < size; i++) {
    // Generate hours normally clustered around 9:00 - 18:00 (workday hours)
    const u1 = Math.random() || 0.0001;
    const u2 = Math.random() || 0.0001;
    const randStdNormal = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    
    // Mean of 13.5 hours, standard deviation of 3.5 hours
    let hour = Math.round(13.5 + randStdNormal * 3.5);
    if (hour < 0) hour = (24 + (hour % 24)) % 24;
    hour = hour % 24;

    // Normal transaction amounts
    const amountVal = Math.max(10, amountMean + randStdNormal * amountStd);

    // Normal failed login attempts: 92% 0, 7% 1, 1% 2
    const roll = Math.random();
    const failedAttempts = roll < 0.92 ? 0 : roll < 0.99 ? 1 : 2;

    // Session duration: normal 8-40 minutes
    const sessionDuration = Math.round(Math.max(2, 18 + randStdNormal * 8));

    // Device change is rare (3%)
    const deviceChange = Math.random() < 0.03 ? 1 : 0;

    // Browser fingerprint match is standard (97% match)
    const browserFingerprintMatch = Math.random() < 0.97 ? 1 : 0;

    // IP reputation is clean (reputation score 0 to 12)
    const ipReputation = Math.floor(Math.random() * 12);

    // Location mismatch is rare (3%)
    const locationMatch = Math.random() < 0.97 ? 1 : 0;

    // Transaction frequency
    const transactionFrequency = Math.max(0.1, freqMean + randStdNormal * 0.25);

    // New beneficiary is rare (4%)
    const newBeneficiary = Math.random() < 0.04 ? 1 : 0;

    baseline.push({
      loginHour: hour,
      deviceChange,
      browserFingerprintMatch,
      ipReputation,
      failedAttempts,
      sessionDuration,
      locationMatch,
      transactionAmount: Math.round(amountVal * 100) / 100,
      transactionFrequency: Math.round(transactionFrequency * 100) / 100,
      newBeneficiary,
    });
  }

  return baseline;
}

export interface ExplanationResult {
  riskScore: number;
  anomalyScore: number;
  severity: "Low" | "Medium" | "High" | "Critical";
  reasons: string[];
  recommendedAction: string;
}

/**
 * Compares the current simulated behavioral feature vector to user history to yield
 * a logical human-readable explanation matching the ML anomaly score output.
 */
export function explainBehavioralRisk(
  current: BehavioralFeatures,
  baseline: BehavioralFeatures[],
  anomalyScore: number
): ExplanationResult {
  const reasons: string[] = [];

  // Compute baseline stats
  const amounts = baseline.map(b => b.transactionAmount);
  const amountMean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
  const amountVariance = amounts.reduce((a, b) => a + Math.pow(b - amountMean, 2), 0) / amounts.length;
  const amountStd = Math.sqrt(amountVariance);

  const durations = baseline.map(b => b.sessionDuration);
  const durationMean = durations.reduce((a, b) => a + b, 0) / durations.length;
  const durationVariance = durations.reduce((a, b) => a + Math.pow(b - durationMean, 2), 0) / durations.length;
  const durationStd = Math.sqrt(durationVariance);

  // 1. Transaction Amount
  if (current.transactionAmount > amountMean + 3 * amountStd) {
    const ratio = Math.round(current.transactionAmount / amountMean);
    reasons.push(`Transaction amount of $${current.transactionAmount.toLocaleString()} is ${ratio}x higher than historic average ($${Math.round(amountMean)})`);
  }

  // 2. Failed Attempts
  if (current.failedAttempts >= 3) {
    reasons.push(`Unusual burst of failed login attempts (${current.failedAttempts}) prior to transaction`);
  }

  // 3. Location mismatch
  if (current.locationMatch === 0) {
    reasons.push(`Sign-in location is outside the home region / registered primary locations`);
  }

  // 4. Device change
  if (current.deviceChange === 1) {
    reasons.push(`New or unrecognized device sign-in signature detected`);
  }

  // 5. Browser fingerprint
  if (current.browserFingerprintMatch === 0) {
    reasons.push(`Browser fingerprint canvas matching mismatch compared to registered profiles`);
  }

  // 6. IP Reputation
  if (current.ipReputation > 50) {
    reasons.push(`Connection initiated via Tor/VPN exit node or a proxy with bad reputation (${current.ipReputation}/100)`);
  }

  // 7. Login time (Atypical hours)
  if (current.loginHour < 6 || current.loginHour > 22) {
    reasons.push(`Login activity occurred during off-hours (${current.loginHour.toString().padStart(2, "0")}:00), outside user's standard diurnal window`);
  }

  // 8. Session Duration
  if (current.sessionDuration > durationMean + 3 * durationStd) {
    reasons.push(`Unusually prolonged session duration (${current.sessionDuration} minutes) indicates potential session hijacking`);
  }

  // 9. Transaction frequency
  const freqs = baseline.map(b => b.transactionFrequency);
  const freqMean = freqs.reduce((a, b) => a + b, 0) / freqs.length;
  if (current.transactionFrequency > freqMean * 3) {
    reasons.push(`Rapid transaction frequency spikes (${current.transactionFrequency}/hr) indicating brute-force transfer operations`);
  }

  // 10. New Beneficiary
  if (current.newBeneficiary === 1) {
    reasons.push(`Transfer requested to a newly added beneficiary within the same session`);
  }

  // Scale anomalyScore to dynamic risk score (0-100)
  let riskScore = 15;
  if (anomalyScore <= 0.40) {
    riskScore = 15 + (anomalyScore / 0.40) * 30; // 15 - 45
  } else if (anomalyScore <= 0.58) {
    riskScore = 45 + ((anomalyScore - 0.40) / 0.18) * 30; // 45 - 75
  } else {
    riskScore = 75 + Math.min(1.0, (anomalyScore - 0.58) / 0.25) * 24; // 75 - 99
  }
  riskScore = Math.round(riskScore);

  // Determine Severity
  let severity: "Low" | "Medium" | "High" | "Critical" = "Low";
  if (riskScore >= 82) severity = "Critical";
  else if (riskScore >= 65) severity = "High";
  else if (riskScore >= 45) severity = "Medium";

  // Recommended Action
  let recommendedAction = "No action required. Activity is consistent with baseline.";
  if (severity === "Critical") {
    recommendedAction = "IMMEDIATE BLOCK: Freeze user session, abort transactions, and require out-of-band video verification.";
  } else if (severity === "High") {
    recommendedAction = "MFA CHALLENGE: Request biometric verification and temporarily hold wire transfers.";
  } else if (severity === "Medium") {
    recommendedAction = "STEPS CHALLENGE: Request step-up OTP authentication and audit next 3 transactions.";
  } else if (reasons.length > 0) {
    recommendedAction = "LOG & MONITOR: Alert user of unusual login and track browser behavior.";
  }

  // Fallback reason if anomaly score is somehow high but list is empty (ML edge case)
  if (reasons.length === 0 && riskScore > 50) {
    reasons.push("Multiple combined feature deviations detected by Isolation Forest trees");
  }

  return {
    riskScore,
    anomalyScore: Math.round(anomalyScore * 100) / 100,
    severity,
    reasons,
    recommendedAction,
  };
}
