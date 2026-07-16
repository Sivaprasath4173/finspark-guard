/**
 * AI Explanation Service — generates plain-English analyst briefs for alerts.
 *
 * Currently uses deterministic, context-aware templates that mimic LLM output.
 * To integrate a real model (e.g., Gemini API), replace the `explainAlert`
 * implementation here and keep the same function signature so call-sites
 * require no changes.
 *
 * Returns an array of paragraphs:
 *   [0] — what happened (event + transaction correlation narrative)
 *   [1] — z-score / statistical confidence breakdown
 *   [2] — recommended analyst action based on severity
 */
export { explainAlert } from "@/lib/trustlens-data";
