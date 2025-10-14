import { StackType } from "../types";
import { getAppNameForStackType } from "./stack-utils";

/**
 * Return candidate export names for a given appName/stage and logical output key.
 * The returned array is prioritized: preferred parameterized names first, then
 * legacy fallbacks.
 */
export function candidateExportNames(
  stackType: StackType,
  stage: string,
  logicalKey: string,
): string[] {
  const appName = getAppNameForStackType(stackType);

  const parameterized = `nlmonorepo-${appName}-${stage}-${logicalKey}`;
  const alt1 = `nlmonorepo-${appName}example-${stage}-${logicalKey}`;
  const legacy1 = `${appName.toUpperCase()}${logicalKey[0].toUpperCase() + logicalKey.slice(1)}`; // e.g., AWSEUserPoolId

  return [parameterized, alt1, legacy1];
}
