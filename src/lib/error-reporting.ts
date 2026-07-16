/**
 * Error Reporter — generic client-side error reporting utility.
 *
 * Drop in a real reporting SDK (e.g., Sentry, Datadog RUM) by replacing the
 * `reportError` implementation. The call-sites in __root.tsx require no changes.
 */

type ErrorContext = Record<string, unknown>;

/**
 * Report an unhandled error to the configured monitoring backend.
 * Currently a no-op — wire up a real SDK as needed.
 */
export function reportError(error: unknown, context: ErrorContext = {}): void {
  if (typeof window === "undefined") return;

  // Log to console in development so errors are never silently swallowed.
  if (process.env.NODE_ENV !== "production") {
    console.error("[ErrorReporter]", error, context);
  }

  // TODO: integrate your error monitoring SDK here, e.g.:
  // Sentry.captureException(error, { extra: context });
}
