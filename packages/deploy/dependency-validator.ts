import { logger } from "./utils/logger";
import { StackType } from "./types";
import { OutputsManager } from "./outputs-manager";

export interface StackDependency {
  stack: StackType;
  requiredFor: StackType[];
  dependsOn: StackType[];
}

export class DependencyValidator {
  private outputsManager: OutputsManager;

  // Define the dependency graph
  private readonly dependencies: Record<StackType, StackType[]> = {
    [StackType.WAF]: [], // WAF has no dependencies
    [StackType.Shared]: [StackType.WAF], // Shared depends on WAF
    [StackType.CWL]: [StackType.WAF, StackType.Shared], // CWL depends on both WAF and Shared
    [StackType.AwsExample]: [StackType.Shared], // aws-example depends on Shared
  };

  // Define which stacks are dependent on each stack
  private readonly dependents: Record<StackType, StackType[]> = {
    [StackType.WAF]: [StackType.Shared, StackType.CWL], // WAF is required by Shared and CWL
    [StackType.Shared]: [StackType.CWL], // Shared is required by CWL
    [StackType.CWL]: [], // CWL has no dependents
    [StackType.AwsExample]: [], // aws-example has no dependents
  };

  constructor() {
    this.outputsManager = new OutputsManager();
  }

  /**
   * Validates that all dependencies of a stack are deployed and healthy
   */
  async validateDependencies(
    stackType: StackType,
    stage: string,
  ): Promise<boolean> {
    const dependencies = this.dependencies[stackType];

    if (dependencies.length === 0) {
      logger.info(`Stack ${stackType} has no dependencies`);
      return true;
    }

    logger.debug(
      `Validating dependencies for ${stackType}: ${dependencies.join(", ")}`,
    );

    const validationResults: { stack: StackType; exists: boolean }[] = [];

    for (const dependency of dependencies) {
      const exists = await this.outputsManager.validateStackExists(
        dependency,
        stage,
      );
      validationResults.push({ stack: dependency, exists });

      if (exists) {
        logger.debug(`✓ Dependency ${dependency} is deployed and healthy`);
      } else {
        logger.error(`✗ Dependency ${dependency} is not deployed or unhealthy`);
      }
    }

    const failedDependencies = validationResults.filter((r) => !r.exists);

    if (failedDependencies.length > 0) {
      const failedStacks = failedDependencies.map((r) => r.stack).join(", ");
      logger.error(
        `Cannot deploy ${stackType} - missing dependencies: ${failedStacks}`,
      );
      logger.info(
        `Please deploy the missing dependencies first: ${failedStacks}`,
      );
      return false;
    }

    logger.debug(`All dependencies for ${stackType} are satisfied`);
    return true;
  }

  /**
   * Gets the deployment order for all stacks based on dependencies
   */
  getDeploymentOrder(): StackType[] {
    const ordered: StackType[] = [];
    const visited = new Set<StackType>();

    const visit = (stack: StackType) => {
      if (visited.has(stack)) return;
      visited.add(stack);

      // Visit dependencies first
      for (const dependency of this.dependencies[stack]) {
        visit(dependency);
      }

      ordered.push(stack);
    };

    // Visit all stacks to ensure we get the complete order (iterate programmatically)
    for (const stack of Object.values(StackType)) {
      visit(stack);
    }

    return ordered;
  }

  /**
   * Gets the removal order (reverse of deployment order)
   */
  getRemovalOrder(): StackType[] {
    return this.getDeploymentOrder().reverse();
  }

  /**
   * Validates that a stack can be removed (i.e., no other stacks depend on it)
   */
  async validateRemoval(stackType: StackType, stage: string): Promise<boolean> {
    const dependents = this.dependents[stackType];

    if (dependents.length === 0) {
      logger.info(
        `Stack ${stackType} has no dependents and can be removed safely`,
      );
      return true;
    }

    logger.info(
      `Validating removal for ${stackType}. Checking dependents: ${dependents.join(", ")}`,
    );

    const validationResults: { stack: StackType; exists: boolean }[] = [];

    for (const dependent of dependents) {
      const exists = await this.outputsManager.validateStackExists(
        dependent,
        stage,
      );
      validationResults.push({ stack: dependent, exists });

      if (exists) {
        logger.error(
          `✗ Cannot remove ${stackType} - dependent stack ${dependent} is still deployed`,
        );
      } else {
        logger.success(`✓ Dependent ${dependent} is not deployed`);
      }
    }

    const deployedDependents = validationResults.filter((r) => r.exists);

    if (deployedDependents.length > 0) {
      const deployedStacks = deployedDependents.map((r) => r.stack).join(", ");
      logger.error(
        `Cannot remove ${stackType} - the following dependent stacks are still deployed: ${deployedStacks}`,
      );
      logger.info(
        `Please remove the dependent stacks first: ${deployedStacks}`,
      );
      return false;
    }

    logger.success(
      `All dependents for ${stackType} are removed. It is safe to remove.`,
    );
    return true;
  }

  /**
   * Validates the entire dependency chain for a deployment
   */
  async validateDeploymentChain(
    stacks: StackType[],
    stage: string,
  ): Promise<boolean> {
    logger.info(`Validating deployment chain: ${stacks.join(" → ")}`);

    for (let i = 0; i < stacks.length; i++) {
      const stack = stacks[i];
      const isValid = await this.validateDependencies(stack, stage);

      if (!isValid) {
        logger.error(
          `Dependency validation failed for ${stack} at position ${i + 1} in the chain`,
        );
        return false;
      }
    }

    logger.success("Deployment chain validation passed");
    return true;
  }

  /**
   * Prints the dependency graph for debugging
   */
  printDependencyGraph(): void {
    logger.info("Deployment Dependency Graph:");
    for (const [stack, deps] of Object.entries(this.dependencies)) {
      if (deps.length === 0) {
        logger.info(`  ${stack}: (no dependencies)`);
      } else {
        logger.info(`  ${stack}: depends on [${deps.join(", ")}]`);
      }
    }

    logger.info("Removal Order (reverse dependency):");
    const removalOrder = this.getRemovalOrder();
    logger.info(`  ${removalOrder.join(" → ")}`);
  }
}

/**
 * Returns the ordered dependency chain for a given stack (dependencies first, then the stack).
 */
export function getDependencyChain(target: StackType): StackType[] {
  // Reconstruct the same dependency map used by DependencyValidator
  const dependencies: Record<StackType, StackType[]> = {
    [StackType.WAF]: [],
    [StackType.Shared]: [StackType.WAF],
    [StackType.CWL]: [StackType.WAF, StackType.Shared],
    [StackType.AwsExample]: [StackType.Shared],
  };

  const ordered: StackType[] = [];
  const visited = new Set<StackType>();

  const visit = (stack: StackType) => {
    if (visited.has(stack)) return;
    visited.add(stack);
    for (const dep of dependencies[stack] || []) {
      visit(dep);
    }
    ordered.push(stack);
  };

  visit(target);
  return ordered;
}
