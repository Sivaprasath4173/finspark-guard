import { GoogleGenerativeAI } from "@google/generative-ai";
import { EVENT_LABEL, type Alert, type User } from "@/lib/trustlens-data";

// Fallback template-based explanation if API key is not configured
export function explainAlertFallback(alert: Alert, user: User | undefined): string[] {
  const loc = user?.homeLocation ?? "the account's home region";
  const evtLabel = EVENT_LABEL[alert.triggeringEventType];
  const amountStr = `$${alert.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  const window = `${alert.proximityMinutes} min`;
  const sev = alert.severity;

  const line1Options = {
    failed_login: `A burst of failed login attempts preceded a ${amountStr} transaction on ${user?.name ?? "this account"}, ${window} apart.`,
    new_device: `Sign-in from an unrecognized device was followed by a ${amountStr} transaction within a ${window} window.`,
    tor_ip: `Session originated from a known Tor/VPN exit node just ${window} before a ${amountStr} transaction cleared.`,
    impossible_travel: `Geo-impossible session was observed ${window} before a ${amountStr} transaction on the same account, inconsistent with ${loc}.`,
    malware_beacon: `Endpoint beaconing to a known malware C2 was detected ${window} before a ${amountStr} transaction was authorized.`,
  }[alert.triggeringEventType];

  const line2 = `The composite z-score is ${alert.zScore.toFixed(2)} against a baseline of $240±180, and the ${evtLabel} weight combined with the ${window} proximity pushes correlation confidence to ${alert.riskScore}/100.`;

  const line3Options = {
    Critical: `Recommended action: block the transaction, freeze the session, and page the on-call fraud responder immediately.`,
    High: `Recommended action: hold the transaction, force step-up MFA, and escalate to Tier-2 for verification within 5 minutes.`,
    Medium: `Recommended action: challenge the user with step-up authentication and monitor the next 30 minutes of activity.`,
    Low: `Recommended action: log for pattern learning and notify the user of the unusual sign-in to close the loop.`,
  }[sev];

  return [line1Options, line2, line3Options];
}

/**
 * explainAlertAI — Generates a live, deep security audit brief for the alert.
 * Tries calling Gemini API, falls back gracefully if key is missing.
 */
export async function explainAlertAI(
  alert: Alert,
  user: User | undefined,
  customApiKey?: string
): Promise<{ text: string[]; source: "Gemini 2.0 Flash" | "Local Correlation Model" }> {
  const apiKey = customApiKey || (import.meta.env.VITE_GEMINI_API_KEY as string);

  if (!apiKey) {
    return {
      text: explainAlertFallback(alert, user),
      source: "Local Correlation Model",
    };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
      You are an elite cyber-banking forensic fraud investigator analyzing a correlated event.
      Analyze this data profile and provide a professional, brief 3-paragraph summary:
      - Threat Event Type: ${EVENT_LABEL[alert.triggeringEventType]}
      - Incident Severity: ${alert.severity}
      - Account Name: ${user?.name ?? "Unknown"} (Tier: ${user?.tier ?? "Standard"}, Home Location: ${user?.homeLocation ?? "Unknown"})
      - Transaction Amount: $${alert.amount}
      - Z-Score Deviation: ${alert.zScore} (against baseline $240 stddev $180)
      - Cyber/Banking Event Proximity: ${alert.proximityMinutes} minutes
      
      Requirements for response structure:
      Paragraph 1: Forensic analysis explaining the correlation pattern (e.g. session hijack, malware vector).
      Paragraph 2: Statistical & Threat score verification details (mentioning the z-score ${alert.zScore} and risk ${alert.riskScore}/100).
      Paragraph 3: Executive containment recommendation & immediate playbook step.
      
      Keep the tone highly professional, crisp, and under 150 words total. Do not use markdown headers, just plain text paragraphs. Return exactly 3 paragraphs.
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const paras = text
      .split("\n")
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    if (paras.length >= 3) {
      return { text: paras.slice(0, 3), source: "Gemini 2.0 Flash" };
    }
    return { text: [text], source: "Gemini 2.0 Flash" };
  } catch (error) {
    console.error("Gemini API error:", error);
    return {
      text: explainAlertFallback(alert, user),
      source: "Local Correlation Model",
    };
  }
}
export { explainAlertFallback as explainAlert };
