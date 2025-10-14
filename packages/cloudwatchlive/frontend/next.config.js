const { readFileSync } = require("fs");
const { join } = require("path");

function getDeploymentOutputs() {
  try {
    const p = join(__dirname, "../../deploy/deployment-outputs.json");
    const raw = readFileSync(p, "utf8");
    const parsed = JSON.parse(raw);

    const outputs = Object.values(parsed.stacks || {})
      .flatMap((s) => s.outputs || [])
      .map((o) => ({ key: o.OutputKey, value: o.OutputValue, exportName: o.ExportName }));

    const find = (suffix, legacy = []) => {
      const s = suffix.toLowerCase();
      const param = outputs.find((o) => o.exportName && o.exportName.toLowerCase().includes(`nlmonorepo-${s}`));
      if (param) return param.value;
      const en = outputs.find((o) => o.exportName && o.exportName.toLowerCase().endsWith(s));
      if (en) return en.value;
      const ok = outputs.find((o) => (o.key || "").toLowerCase().endsWith(s));
      if (ok) return ok.value;
      const leg = legacy.map((k) => outputs.find((o) => o.key === k)).find(Boolean);
      return leg ? leg.value : "";
    };

    return {
      NEXT_PUBLIC_USER_POOL_ID: find("user-pool-id", ["CWLUserPoolId"]),
      NEXT_PUBLIC_USER_POOL_CLIENT_ID: find("user-pool-client-id", ["CWLUserPoolClientId"]),
      NEXT_PUBLIC_IDENTITY_POOL_ID: find("identity-pool-id", ["CWLIdentityPoolId"]),
      NEXT_PUBLIC_GRAPHQL_URL: find("api-url", ["ApiUrl"]),
    };
  } catch (e) {
    return {};
  }
}

const deploymentEnvs = getDeploymentOutputs();

module.exports = {
  env: {
    NEXT_PUBLIC_ENVIRONMENT: process.env.NEXT_PUBLIC_ENVIRONMENT,
    ...deploymentEnvs,
  },
  eslint: { ignoreDuringBuilds: true },
  compiler: { styledComponents: true },
  images: { unoptimized: true },
  transpilePackages: ["cloudwatchlive"],
  pageExtensions: ["tsx", "mdx"],
  trailingSlash: true,
};
