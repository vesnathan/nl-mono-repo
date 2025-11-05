const { readFileSync } = require("fs");
const { join } = require("path");

function getDeploymentOutputs() {
  try {
    const p = join(__dirname, "../../deploy/deployment-outputs.json");
    const raw = readFileSync(p, "utf8");
    const parsed = JSON.parse(raw);

    // Only use outputs from the TheStoryHub stack to avoid accidental cross-app picks
    const awseStack = parsed.stacks && parsed.stacks.TheStoryHub;
    if (!awseStack || !Array.isArray(awseStack.outputs)) return {};

    const outputs = awseStack.outputs.map((o) => ({
      key: o.OutputKey,
      value: o.OutputValue,
      exportName: o.ExportName,
    }));

    // Helper: produce prioritized candidate export names for this app
    const appName = "tsh"; // short app identifier for the-story-hub
    const stage =
      process.env.NEXT_PUBLIC_ENVIRONMENT || process.env.STAGE || "dev";
    function paramCandidates(suffix) {
      const base = `nlmonorepo-${appName}-${stage}-${suffix}`;
      const alt = `nlmonorepo-${appName}example-${stage}-${suffix}`; // transitional
      return [base.toLowerCase(), alt.toLowerCase(), suffix.toLowerCase()];
    }

    const find = (suffix, legacy = []) => {
      const candidates = paramCandidates(suffix);
      // check ExportName candidates first
      for (const c of candidates) {
        const hit = outputs.find(
          (o) => (o.exportName || "").toLowerCase() === c,
        );
        if (hit) return hit.value;
      }

      // then try export names that end with the suffix
      const byExportSuffix = outputs.find((o) =>
        (o.exportName || "").toLowerCase().endsWith(suffix.toLowerCase()),
      );
      if (byExportSuffix) return byExportSuffix.value;

      // then try output keys that end with suffix
      const byKeySuffix = outputs.find((o) =>
        (o.key || "").toLowerCase().endsWith(suffix.toLowerCase()),
      );
      if (byKeySuffix) return byKeySuffix.value;

      // then try legacy explicit keys
      const legacyHit = legacy
        .map((k) => outputs.find((o) => (o.key || "") === k))
        .find(Boolean);
      if (legacyHit) return legacyHit.value;

      return "";
    };

    return {
      NEXT_PUBLIC_USER_POOL_ID: find("user-pool-id", ["TSHUserPoolId"]),
      NEXT_PUBLIC_USER_POOL_CLIENT_ID: find("user-pool-client-id", [
        "TSHUserPoolClientId",
      ]),
      NEXT_PUBLIC_IDENTITY_POOL_ID: find("identity-pool-id", [
        "TSHIdentityPoolId",
      ]),
      NEXT_PUBLIC_GRAPHQL_URL: find("api-url", ["ApiUrl"]),
    };
  } catch (e) {
    return {};
  }
}

const deploymentEnvs = getDeploymentOutputs();

// Fail loudly in non-development when required NEXT_PUBLIC vars are missing
function assertRequiredDeploymentEnvs(envs) {
  const required = [
    "NEXT_PUBLIC_USER_POOL_ID",
    "NEXT_PUBLIC_USER_POOL_CLIENT_ID",
    "NEXT_PUBLIC_IDENTITY_POOL_ID",
    "NEXT_PUBLIC_GRAPHQL_URL",
  ];
  const missing = required.filter((k) => !envs[k]);
  // Skip validation during lint or in development
  const isLinting =
    process.env.npm_lifecycle_event === "lint" || process.argv.includes("lint");
  if (
    missing.length > 0 &&
    process.env.NODE_ENV !== "development" &&
    !isLinting
  ) {
    throw new Error(
      `Missing required deployment envs for TSH in non-development: ${missing.join(", ")}. Ensure the TheStoryHub stack is deployed or set the NEXT_PUBLIC_* env vars.`,
    );
  }
}

// Assert required NEXT_PUBLIC_* envs in non-dev (skip during lint)
const isLinting =
  process.env.npm_lifecycle_event === "lint" || process.argv.includes("lint");
if (!isLinting) {
  try {
    assertRequiredDeploymentEnvs(deploymentEnvs);
  } catch (e) {
    // rethrow so build fails in CI/non-dev when envs are missing
    throw e;
  }
}

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
  transpilePackages: ["the-story-hub"],
  pageExtensions: ["tsx", "mdx"],
  trailingSlash: true,
};
