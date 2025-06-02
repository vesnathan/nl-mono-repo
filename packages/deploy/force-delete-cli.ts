#!/usr/bin/env node

import { Command } from 'commander';
import { ForceDeleteManager } from './utils/force-delete-utils';
import { logger } from './utils/logger';
import { getStackName, StackType } from './types';

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
      const stackType = options.type as StackType;
      const stage = options.stage;
      const maxWaitMinutes = parseInt(options.maxWait);
      
      // Determine region
      let region = options.region;
      if (!region) {
        region = stackType === 'waf' ? 'us-east-1' : process.env.AWS_REGION || 'ap-southeast-2';
      }
      
      logger.info(`Force deleting ${stackType} stack for stage ${stage} in region ${region}`);
      
      const forceDeleteManager = new ForceDeleteManager(region);
      await forceDeleteManager.forceDeleteStack(stackType, {
        stage,
        maxWaitMinutes
      });
      
      logger.success(`Stack force deleted successfully: ${getStackName(stackType, stage)}`);
    } catch (error: any) {
      logger.error(`Force delete failed: ${error.message}`);
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
      const stackTypes: StackType[] = ['cwl', 'shared', 'waf'];
      
      logger.info(`Force deleting all stacks for stage ${stage} in order: ${stackTypes.join(' → ')}`);
      
      for (const stackType of stackTypes) {
        try {
          const region = stackType === 'waf' ? 'us-east-1' : process.env.AWS_REGION || 'ap-southeast-2';
          
          logger.info(`Force deleting ${stackType} stack...`);
          const forceDeleteManager = new ForceDeleteManager(region);
          await forceDeleteManager.forceDeleteStack(stackType, {
            stage,
            maxWaitMinutes
          });
          
          logger.success(`${stackType} stack force deleted successfully`);
        } catch (error: any) {
          logger.error(`Failed to force delete ${stackType} stack: ${error.message}`);
          // Continue with other stacks
        }
      }
      
      logger.success('All stacks force delete process completed');
    } catch (error: any) {
      logger.error(`Force delete all failed: ${error.message}`);
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
      const specificType = options.type as StackType | undefined;
      
      const stackTypes = specificType ? [specificType] : ['waf', 'shared', 'cwl'] as StackType[];
      
      logger.info(`Cleaning up S3 buckets for stage ${stage}`);
      
      for (const stackType of stackTypes) {
        try {
          const region = stackType === 'waf' ? 'us-east-1' : process.env.AWS_REGION || 'ap-southeast-2';
          
          logger.info(`Cleaning up S3 buckets for ${stackType}...`);
          const forceDeleteManager = new ForceDeleteManager(region);
          await forceDeleteManager.cleanupS3Buckets(stackType, stage);
          
          logger.success(`S3 cleanup completed for ${stackType}`);
        } catch (error: any) {
          logger.error(`Failed to cleanup S3 for ${stackType}: ${error.message}`);
          // Continue with other stack types
        }
      }
      
      logger.success('S3 cleanup process completed');
    } catch (error: any) {
      logger.error(`S3 cleanup failed: ${error.message}`);
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
      const stage = options.stage;
      const specificType = options.type as StackType | undefined;
      
      const stackTypes = specificType ? [specificType] : ['waf', 'shared', 'cwl'] as StackType[];
      
      logger.info(`Checking stack status for stage ${stage}`);
      
      for (const stackType of stackTypes) {
        try {
          const region = stackType === 'waf' ? 'us-east-1' : process.env.AWS_REGION || 'ap-southeast-2';
          const stackName = getStackName(stackType, stage);
          
          const forceDeleteManager = new ForceDeleteManager(region);
          const status = await forceDeleteManager.getStackStatus(stackName);
          
          if (status) {
            logger.info(`${stackType} (${stackName}): ${status}`);
          } else {
            logger.info(`${stackType} (${stackName}): DOES_NOT_EXIST`);
          }
        } catch (error: any) {
          logger.error(`Failed to check status for ${stackType}: ${error.message}`);
        }
      }
    } catch (error: any) {
      logger.error(`Status check failed: ${error.message}`);
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse();
