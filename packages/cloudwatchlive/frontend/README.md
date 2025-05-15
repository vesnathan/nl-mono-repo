# CloudWatchLive Frontend

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Configuration Management

The frontend reads its configuration from `/packages/shared/config/cloudformation-outputs.json`. This file contains all stage-specific AWS resource configurations including:

- Cognito User Pool IDs
- AppSync GraphQL endpoints
- Other AWS resource identifiers

The configuration is automatically loaded based on the `NEXT_PUBLIC_ENVIRONMENT` environment variable. You don't need to manually update this file - it's maintained by the deployment scripts of other packages.

## Getting Started

First, ensure the backend stack is deployed and the configuration file exists. Then run the development server:

```bash
# Navigate to the frontend package
cd /home/liqk1ugzoezh5okwywlr_/dev/nl-mono-repo/packages/cloudwatchlive/frontend

# Install dependencies if needed
yarn install

# Start the development server
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Build and Deployment

To build the frontend for production:

```bash
# Navigate to the frontend package
cd /home/liqk1ugzoezh5okwywlr_/dev/nl-mono-repo/packages/cloudwatchlive/frontend

# Build the application
yarn build
```

## Environment Variables

The frontend uses the following environment variables:

- `NEXT_PUBLIC_ENVIRONMENT`: Determines which stage configuration to use ('dev', 'staging', 'prod')

These variables can be set in `.env` files or during deployment.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
