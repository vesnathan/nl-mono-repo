/**
 * Deploy Handler Registry
 *
 * This module provides a dynamic registry for deploy handlers, eliminating the need
 * for hardcoded if-else chains. Each stack type registers its deploy function here.
 *
 * HOW TO ADD A NEW PACKAGE:
 * 1. Create your deploy function in packages/{your-package}/deploy.ts
 * 2. Export it as: export async function deploy{YourPackage}(options: DeploymentOptions): Promise<void>
 * 3. Add it to the imports and DEPLOY_HANDLERS below
 *
 * The bootstrap script automatically handles step 3.
 */

import { StackType, DeploymentOptions } from "./types";
import { deployWaf } from "./packages/waf/waf";
import { deployShared } from "./packages/shared/shared";
import { deployCwl } from "./packages/cwl/deploy";
import { deployAwsExample } from "./packages/aws-example/deploy";
import { deployTheStoryHub } from "./packages/the-story-hub/deploy";
/**
 * Type for deploy handler functions
 */
export type DeployHandler = (options: DeploymentOptions) => Promise<void>;

/**
 * Registry mapping StackType to deploy handler
 * This is the single source of truth for all deploy handlers.
 * No hardcoded if-else chains needed!
 */
const DEPLOY_HANDLERS: Record<StackType, DeployHandler> = {
  [StackType.WAF]: deployWaf,
  [StackType.Shared]: deployShared,
  [StackType.CWL]: deployCwl,
  [StackType.AwsExample]: deployAwsExample,
  [StackType.TheStoryHub]: deployTheStoryHub,
};

/**
 * Get the deploy handler for a given stack type
 * @param stackType - The stack type to deploy
 * @returns The deploy handler function
 * @throws Error if no handler is registered for the stack type
 */
export function getDeployHandler(stackType: StackType): DeployHandler {
  const handler = DEPLOY_HANDLERS[stackType];
  if (!handler) {
    throw new Error(
      `No deploy handler registered for stack type: ${stackType}`,
    );
  }
  return handler;
}

/**
 * Register a deploy handler for a stack type
 * This allows new packages to register themselves without modifying this file
 * (though for now, they're added directly to DEPLOY_HANDLERS)
 *
 * @param stackType - The stack type
 * @param handler - The deploy handler function
 */
export function registerDeployHandler(
  stackType: StackType,
  handler: DeployHandler,
): void {
  DEPLOY_HANDLERS[stackType] = handler;
}

/**
 * Check if a handler is registered for a stack type
 * @param stackType - The stack type to check
 * @returns True if a handler is registered
 */
export function hasDeployHandler(stackType: StackType): boolean {
  return stackType in DEPLOY_HANDLERS;
}
