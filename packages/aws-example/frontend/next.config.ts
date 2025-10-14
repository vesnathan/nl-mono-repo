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

    // The stack name is 'AwsExample' (matching StackType enum)
    const awseStack = outputs.stacks.AwsExample;
    if (!awseStack) {
      console.warn(
        "AwsExample stack outputs not found in deployment-outputs.json",
      );
      console.warn("Available stacks:", Object.keys(outputs.stacks));
      return {};
    }

    type Output = { OutputKey: string; OutputValue: string };

    const getValue = (key: string) =>
      awseStack.outputs.find((o: Output) => o.OutputKey === key)?.OutputValue ||
      "";

    // Fallback resolver: if the explicit AWSE keys are not found, attempt to
    // find outputs by suffix heuristics so we can support parameterized export
    // names like nlmonorepo-<AppName>-<Stage>-user-pool-id
    const findBySuffix = (suffix: string) => {
      const found = awseStack.outputs.find((o: Output) =>
        o.OutputKey.toLowerCase().endsWith(suffix.toLowerCase()),
      );
      return found ? found.OutputValue : "";
    };
    const envVars = {
      NEXT_PUBLIC_USER_POOL_ID:
        getValue("AWSEUserPoolId") || findBySuffix("user-pool-id"),
      NEXT_PUBLIC_USER_POOL_CLIENT_ID:
        getValue("AWSEUserPoolClientId") || findBySuffix("user-pool-client-id"),
      NEXT_PUBLIC_IDENTITY_POOL_ID:
        getValue("AWSEIdentityPoolId") || findBySuffix("identity-pool-id"),
      NEXT_PUBLIC_GRAPHQL_URL: getValue("ApiUrl") || findBySuffix("api-url"),
    };

    // Check if any required env vars are missing
    const missingVars = Object.entries(envVars)
      .filter(([, value]) => !value)
      .map(([key]) => key);

    if (missingVars.length > 0) {
      console.warn(
        "⚠️  AwsExample stack is deployed but missing outputs:",
        missingVars.join(", "),
      );
      console.warn(
        "   This is expected for a placeholder stack. Deploy a real stack with Cognito & AppSync for full functionality.",
      );
    }

    return envVars;
  } catch {
    console.warn(
      "Could not read deployment-outputs.json. Using empty env vars for development.",
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
  transpilePackages: ["aws-example"],
  pageExtensions: ["tsx", "mdx"],
  // needed to make the url works on cloudfront
  trailingSlash: true,
};

// Remove or comment out this debug log in production
// console.log(`next.config.js: NODE_ENV is ${process.env.NODE_ENV}`);

export default nextConfig;
