import { readFileSync } from "fs";
import { join } from "path";

/** @type {import('next').NextConfig} */

// Function to read deployment outputs
const getDeploymentOutputs = () => {
  try {
    // Path relative to next.config.ts
    const outputPath = join(__dirname, "../../deploy/deployment-outputs.json");
    const fileContent = readFileSync(outputPath, "utf-8");
    const outputs = JSON.parse(fileContent);

    // The stack name should be uppercase 'CWL'
    const cwlStack = outputs.stacks.CWL;
    if (!cwlStack) {
      console.warn("CWL stack outputs not found in deployment-outputs.json");
      console.warn("Available stacks:", Object.keys(outputs.stacks));
      return {};
    }

    type Output = { OutputKey: string; OutputValue: string };

    const getValue = (key: string) =>
      cwlStack.outputs.find((o: Output) => o.OutputKey === key)?.OutputValue ||
      "";

    return {
      NEXT_PUBLIC_USER_POOL_ID: getValue("CWLUserPoolId"),
      NEXT_PUBLIC_USER_POOL_CLIENT_ID: getValue("CWLUserPoolClientId"),
      NEXT_PUBLIC_IDENTITY_POOL_ID: getValue("CWLIdentityPoolId"),
      NEXT_PUBLIC_GRAPHQL_URL: getValue("ApiUrl"),
    };
  } catch {
    console.warn(
      "Could not read deployment-outputs.json. Build may fail if env vars are not set.",
    );
    return {};
  }
};

const deploymentEnvs = getDeploymentOutputs();

const nextConfig = {
  env: {
    NEXT_PUBLIC_ENVIRONMENT: process.env.NEXT_PUBLIC_ENVIRONMENT,
    ...deploymentEnvs,
  },
  eslint: {
    // Disable ESLint during builds
    ignoreDuringBuilds: true,
  },
  compiler: {
    styledComponents: true,
  },
  // Only use "export" for production builds, not during development
  // Opt-in static export. Set NEXT_EXPORT=true when you want to build a fully
  // static exported site. This avoids requiring generateStaticParams for
  // dynamic routes during regular production builds.
  ...(process.env.NEXT_EXPORT === "true" ? { output: "export" } : {}),
  images: {
    unoptimized: true,
  },
  transpilePackages: ["cloudwatchlive"],
  pageExtensions: ["tsx", "mdx"],
  // needed to make the url works on cloudfront
  trailingSlash: true,
};

// Remove or comment out this debug log in production
// console.log(`next.config.js: NODE_ENV is ${process.env.NODE_ENV}`);

export default nextConfig;
