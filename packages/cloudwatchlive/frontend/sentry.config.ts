// Sentry config for Next.js (optional, for advanced config)
// The DSN is primarily managed via the NEXT_PUBLIC_SENTRY_DSN environment variable.
// This file can be used for more complex shared configurations if needed.

export const sentryConfig = {
  // dsn: process.env.NEXT_PUBLIC_SENTRY_DSN, // DSN is automatically picked up by Sentry.init if not explicitly passed
  tracesSampleRate: 1.0, // Lower this in production if needed
  // environment: process.env.NEXT_PUBLIC_ENVIRONMENT || process.env.NODE_ENV,
  // release: process.env.NEXT_PUBLIC_RELEASE || undefined,
};
