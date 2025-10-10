import * as Sentry from "@sentry/nextjs";

Sentry.init({
  // dsn: 'https://258350a8a8fe3e2b6c403a4f7c3dfc8c@o4509506959245312.ingest.de.sentry.io/4509506960621648',
  // The DSN is automatically picked up from the NEXT_PUBLIC_SENTRY_DSN environment variable.
  tracesSampleRate: 1.0, // Adjust this value in production
  // Add environment, release, or other options as needed
  // For example:
  // environment: process.env.NEXT_PUBLIC_ENVIRONMENT || 'development',
  // release: process.env.NEXT_PUBLIC_RELEASE || undefined,
});
