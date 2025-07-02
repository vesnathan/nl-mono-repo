#!/usr/bin/env node

import { config } from 'dotenv';
import path from 'path';
import { Command } from 'commander';
import { ForceDeleteManager } from './utils/force-delete-utils';
import { logger } from './utils/logger';
import { getStackName, StackType } from './types';

// Load environment variables from mono-repo root
config({ path: path.resolve(__dirname, '../../.env') });

// Helper function to convert string to StackType
function parseStackType(stackTypeStr: string): StackType {
  switch (stackTypeStr.toLowerCase()) {
    case 'waf':
      return StackType.WAF;
    case 'shared':
      return StackType.Shared;
    case 'cwl':
      return StackType.CWL;
    default:
      throw new Error(`Invalid stack type: ${stackTypeStr}. Must be one of: waf, shared, cwl`);
  }
}

// Helper function to get stack status
async function getStackStatus(forceDeleteManager: ForceDeleteManager, stackName: string): Promise<string | null> {
  return await forceDeleteManager.getStackStatus(stackName);
}

const program = new Command();

program
  .name('force-delete')
  .description('Force delete CloudFormation stacks with S3 bucket cleanup')
  .version('1.0.0');

// Force delete a specific stack
program
  .command('stack')
  .description('Force delete a specific stack')
  .requiredOption('--type <type>', 'Stack type (waf, shared, cwl)')
  .requiredOption('--stage <stage>', 'Deployment stage (dev, prod, etc.)')
  .option('--region <region>', 'AWS region (defaults to stack-specific region)')
  .option('--max-wait <minutes>', 'Maximum wait time in minutes', '20')
  .action(async (options) => {
    try {
      const stackType = parseStackType(options.type);
      const stage = options.stage;
      const maxWaitMinutes = parseInt(options.maxWait);
      
      // Determine region
      let region = options.region;
      if (!region) {
        region = stackType === StackType.WAF ? 'us-east-1' : process.env.AWS_REGION || 'ap-southeast-2';
      }
      
      const stackName = getStackName(stackType, stage);
      logger.info(`🚀 Starting force delete operation...`);
      logger.info(`📍 Target: ${stackName} (${stackType}) in ${region}`);
      
      const forceDeleteManager = new ForceDeleteManager(region);
      
      // Use a proper stack identifier - for this workspace it's typically 'nlmonorepo'
      const stackIdentifier = 'nlmonorepo';
      await forceDeleteManager.forceDeleteStack(stackIdentifier, stackType, stage);
      
      logger.success(`🎉 Force delete completed successfully for: ${stackName}`);
    } catch (error: unknown) {
      logger.error(`Force delete failed: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  });

// Force delete all stacks for a stage
program
  .command('all')
  .description('Force delete all stacks for a stage (in reverse dependency order)')
  .requiredOption('--stage <stage>', 'Deployment stage (dev, prod, etc.)')
  .option('--max-wait <minutes>', 'Maximum wait time per stack in minutes', '20')
  .action(async (options) => {
    try {
      const stage = options.stage;
      const maxWaitMinutes = parseInt(options.maxWait);
      
      // Delete in reverse dependency order: cwl -> shared -> waf
      const stackTypes: StackType[] = [StackType.CWL, StackType.Shared, StackType.WAF];
      
      logger.info(`🚀 Starting bulk force delete operation for stage: ${stage}`);
      logger.info(`📋 Deletion order: ${stackTypes.join(' → ')}`);
      
      for (let i = 0; i < stackTypes.length; i++) {
        const stackType = stackTypes[i];
        try {
          const region = stackType === StackType.WAF ? 'us-east-1' : process.env.AWS_REGION || 'ap-southeast-2';
          const stackName = getStackName(stackType, stage);
          
          logger.info(`\n--- Step ${i + 1}/${stackTypes.length}: Processing ${stackType} ---`);
          logger.info(`📍 Target: ${stackName} in ${region}`);
          
          const forceDeleteManager = new ForceDeleteManager(region);
          
          // Use a proper stack identifier - for this workspace it's typically 'nlmonorepo'
          const stackIdentifier = 'nlmonorepo';
          await forceDeleteManager.forceDeleteStack(stackIdentifier, stackType, stage, false);
          
          logger.success(`✅ Step ${i + 1}/${stackTypes.length} completed: ${stackName}`);
        } catch (error: unknown) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          
          // Check if this is a "stack doesn't exist" case vs an actual error
          if (errorMsg.includes('does not exist') || errorMsg.includes('ValidationError')) {
            logger.warning(`⚠️  Stack ${getStackName(stackType, stage)} does not exist. Nothing to remove.`);
          } else {
            logger.error(`❌ Failed to delete ${stackType} stack: ${errorMsg}`);
            logger.warning(`🔄 Continuing with remaining stacks...`);
          }
          // Continue with other stacks
        }
      }
      
      logger.success(`🎉 Bulk force delete completed for stage: ${stage}`);
    } catch (error: unknown) {
      logger.error(`❌ Force delete all failed: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  });

// Clean up S3 buckets without deleting stacks
program
  .command('s3-cleanup')
  .description('Clean up S3 buckets for failed deployments')
  .requiredOption('--stage <stage>', 'Deployment stage (dev, prod, etc.)')
  .option('--type <type>', 'Specific stack type (waf, shared, cwl), or all types if not specified')
  .action(async (options) => {
    try {
      const stage = options.stage;
      const specificType = options.type ? parseStackType(options.type) : undefined;
      
      const stackTypes = specificType ? [specificType] : [StackType.WAF, StackType.Shared, StackType.CWL];
      
      logger.info(`Cleaning up S3 buckets for stage ${stage}`);
      
      for (const stackType of stackTypes) {
        try {
          const region = stackType === StackType.WAF ? 'us-east-1' : process.env.AWS_REGION || 'ap-southeast-2';
          
          logger.info(`Cleaning up S3 buckets for ${stackType}...`);
          const forceDeleteManager = new ForceDeleteManager(region);
          // Use emptyStackS3Buckets instead of cleanupS3Buckets
          await forceDeleteManager.emptyStackS3Buckets(stackType.toLowerCase(), stackType, stage);
          
          logger.success(`S3 cleanup completed for ${stackType}`);
        } catch (error: unknown) {
          logger.error(`Failed to cleanup S3 for ${stackType}: ${error instanceof Error ? error.message : String(error)}`);
          // Continue with other stack types
        }
      }
      
      logger.success('S3 cleanup process completed');
    } catch (error: unknown) {
      logger.error(`S3 cleanup failed: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  });

// Check stack status
program
  .command('status')
  .description('Check the status of stacks')
  .requiredOption('--stage <stage>', 'Deployment stage (dev, prod, etc.)')
  .option('--type <type>', 'Specific stack type (waf, shared, cwl), or all types if not specified')
  .action(async (options) => {
    try {
      logger.debug('Status command starting...');
      const stage = options.stage;
      const specificType = options.type ? parseStackType(options.type) : undefined;
      
      logger.debug(`Stage: ${stage}, Type: ${specificType}`);
      const stackTypes = specificType ? [specificType] : [StackType.WAF, StackType.Shared, StackType.CWL];
      
      logger.info(`Checking stack status for stage ${stage}`);
      
      for (const stackType of stackTypes) {
        try {
          logger.debug(`Processing stack type: ${stackType}`);
          const region = stackType === StackType.WAF ? 'us-east-1' : process.env.AWS_REGION || 'ap-southeast-2';
          logger.debug(`Using region: ${region}`);
          const stackName = getStackName(stackType, stage);
          logger.debug(`Stack name: ${stackName}`);
          
          const forceDeleteManager = new ForceDeleteManager(region);
          logger.debug('ForceDeleteManager created');
          
          // Create a helper method to get stack status
          logger.debug('Calling getStackStatus...');
          const status = await getStackStatus(forceDeleteManager, stackName);
          logger.debug(`Status result: ${status}`);
          
          if (status) {
            logger.info(`${stackType} (${stackName}): ${status}`);
          } else {
            logger.info(`${stackType} (${stackName}): DOES_NOT_EXIST`);
          }
        } catch (error: unknown) {
          logger.error(`Failed to check status for ${stackType}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    } catch (error: unknown) {
      logger.error(`Status check failed: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse();
