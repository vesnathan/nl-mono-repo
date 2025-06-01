import { logger } from './utils/logger';
import { StackType } from './types';
import { OutputsManager } from './outputs-manager';

export interface StackDependency {
  stack: StackType;
  requiredFor: StackType[];
  dependsOn: StackType[];
}

export class DependencyValidator {
  private outputsManager: OutputsManager;
  
  // Define the dependency graph
  private readonly dependencies: Record<StackType, StackType[]> = {
    'waf': [], // WAF has no dependencies
    'shared': ['waf'], // Shared depends on WAF
    'cwl': ['waf', 'shared'] // CWL depends on both WAF and Shared
  };

  // Define which stacks are dependent on each stack
  private readonly dependents: Record<StackType, StackType[]> = {
    'waf': ['shared', 'cwl'], // WAF is required by Shared and CWL
    'shared': ['cwl'], // Shared is required by CWL
    'cwl': [] // CWL has no dependents
  };

  constructor() {
    this.outputsManager = new OutputsManager();
  }

  /**
   * Validates that all dependencies of a stack are deployed and healthy
   */
  async validateDependencies(stackType: StackType, stage: string): Promise<boolean> {
    const dependencies = this.dependencies[stackType];
    
    if (dependencies.length === 0) {
      logger.info(`Stack ${stackType} has no dependencies`);
      return true;
    }

    logger.info(`Validating dependencies for ${stackType}: ${dependencies.join(', ')}`);
    
    const validationResults: { stack: StackType; exists: boolean }[] = [];
    
    for (const dependency of dependencies) {
      const exists = await this.outputsManager.validateStackExists(dependency, stage);
      validationResults.push({ stack: dependency, exists });
      
      if (exists) {
        logger.success(`✓ Dependency ${dependency} is deployed and healthy`);
      } else {
        logger.error(`✗ Dependency ${dependency} is not deployed or unhealthy`);
      }
    }
    
    const failedDependencies = validationResults.filter(r => !r.exists);
    
    if (failedDependencies.length > 0) {
      const failedStacks = failedDependencies.map(r => r.stack).join(', ');
      logger.error(`Cannot deploy ${stackType} - missing dependencies: ${failedStacks}`);
      logger.info(`Please deploy the missing dependencies first: ${failedStacks}`);
      return false;
    }
    
    logger.success(`All dependencies for ${stackType} are satisfied`);
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
    
    // Visit all stacks to ensure we get the complete order
    for (const stack of ['waf', 'shared', 'cwl'] as StackType[]) {
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
   * Gets stacks that depend on the given stack
   */
  getDependentStacks(stackType: StackType): StackType[] {
    return this.dependents[stackType] || [];
  }

  /**
   * Gets stacks that the given stack depends on
   */
  getDependencyStacks(stackType: StackType): StackType[] {
    return this.dependencies[stackType] || [];
  }

  /**
   * Validates that a stack can be safely removed (no dependents are deployed)
   */
  async validateRemoval(stackType: StackType, stage: string): Promise<boolean> {
    const dependents = this.getDependentStacks(stackType);
    
    if (dependents.length === 0) {
      logger.info(`Stack ${stackType} has no dependents - safe to remove`);
      return true;
    }

    logger.info(`Checking if dependents of ${stackType} are deployed: ${dependents.join(', ')}`);
    
    const deployedDependents: StackType[] = [];
    
    for (const dependent of dependents) {
      const exists = await this.outputsManager.validateStackExists(dependent, stage);
      if (exists) {
        deployedDependents.push(dependent);
      }
    }
    
    if (deployedDependents.length > 0) {
      logger.error(`Cannot remove ${stackType} - dependent stacks are still deployed: ${deployedDependents.join(', ')}`);
      logger.info(`Please remove dependent stacks first: ${deployedDependents.join(', ')}`);
      return false;
    }
    
    logger.success(`No dependent stacks found - ${stackType} can be safely removed`);
    return true;
  }

  /**
   * Validates the entire dependency chain for a deployment
   */
  async validateDeploymentChain(stacks: StackType[], stage: string): Promise<boolean> {
    logger.info(`Validating deployment chain: ${stacks.join(' → ')}`);
    
    for (let i = 0; i < stacks.length; i++) {
      const stack = stacks[i];
      const isValid = await this.validateDependencies(stack, stage);
      
      if (!isValid) {
        logger.error(`Dependency validation failed for ${stack} at position ${i + 1} in the chain`);
        return false;
      }
    }
    
    logger.success('Deployment chain validation passed');
    return true;
  }

  /**
   * Prints the dependency graph for debugging
   */
  printDependencyGraph(): void {
    logger.info('Deployment Dependency Graph:');
    for (const [stack, deps] of Object.entries(this.dependencies)) {
      if (deps.length === 0) {
        logger.info(`  ${stack}: (no dependencies)`);
      } else {
        logger.info(`  ${stack}: depends on [${deps.join(', ')}]`);
      }
    }
    
    logger.info('Removal Order (reverse dependency):');
    const removalOrder = this.getRemovalOrder();
    logger.info(`  ${removalOrder.join(' → ')}`);
  }
}
