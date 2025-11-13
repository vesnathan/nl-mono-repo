const { readFileSync } = require("fs");
const { join } = require("path");

// Lawn Order is a simple static site with no Cognito/AppSync - just a contact form Lambda
// No deployment envs needed for build
const deploymentEnvs = {};

module.exports = {
  // Only use static export for production builds (not dev server)
  ...(process.env.NODE_ENV === "production" && { output: "export" }),
  env: {
    NEXT_PUBLIC_ENVIRONMENT: process.env.NEXT_PUBLIC_ENVIRONMENT,
    NEXT_PUBLIC_USE_LOCAL_DATA:
      process.env.NEXT_PUBLIC_USE_LOCAL_DATA || "false",
    ...deploymentEnvs,
  },
  eslint: { ignoreDuringBuilds: true },
  compiler: { styledComponents: true },
  images: { unoptimized: true },
  transpilePackages: ["lawn-order-backend"],
  pageExtensions: ["tsx", "mdx"],
  trailingSlash: true,
};
