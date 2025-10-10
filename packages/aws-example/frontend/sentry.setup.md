# Sentry Setup for aws-example/frontend

## What was added
- Sentry SDK installed: `@sentry/nextjs`
- Sentry config files: `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`
- Example env: `sentry.example.env`
- Sentry CLI config: `sentry.properties`
- Optional: `sentry.config.ts` for advanced/centralized config

## Next steps
1. **Set your Sentry DSN**
   - Already set in config files for now. For production, use the `NEXT_PUBLIC_SENTRY_DSN` env variable.
2. **(Optional) Configure releases, environment, etc.**
   - Edit `sentry.config.ts` and the config files as needed.
3. **(Optional) Upload source maps for better stack traces.**
   - See Sentry docs for Next.js: https://docs.sentry.io/platforms/javascript/guides/nextjs/
4. **Test your integration**
   - You can trigger an error in your app to verify Sentry is capturing it.

## Docs
- https://docs.sentry.io/platforms/javascript/guides/nextjs/
