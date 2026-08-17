/**
 * Generic error reporting utility
 * Logs errors to console in development
 * Can be extended to send to error tracking service (Sentry, LogRocket, etc.)
 */

type ErrorOptions = {
  mechanism?: "manual" | "onerror" | "unhandledrejection" | "react_error_boundary";
  handled?: boolean;
  severity?: "error" | "warning" | "info";
};

export function reportError(error: unknown, context: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;

  // Log to console in development
  if (process.env.NODE_ENV === "development") {
    console.error("Error reported:", error, "Context:", context);
  }

  // Extract error details
  const message =
    error instanceof Response
      ? `Response ${error.status}${error.url ? ` at ${error.url}` : ""}`
      : error instanceof Error
        ? error.message
        : String(error);

  const stack = error instanceof Error ? error.stack : undefined;

  // TODO: Integrate with your error tracking service here
  // Example: send to Sentry, LogRocket, or custom backend
  // sentry.captureException(error, { context });

  console.error("Unhandled error:", {
    message,
    stack,
    filename: typeof window !== "undefined" ? window.location.pathname : "N/A",
    ...context,
  });
}
