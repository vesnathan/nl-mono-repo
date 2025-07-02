#!/usr/bin/env node

/**
 * This script directly removes the WAF stack from the us-east-1 region.
 * Use this if the standard removal process fails to remove the WAF stack.
 * 
 * Usage:
 *   ts-node -r dotenv/config remove-waf.ts --stage dev
 */

import { Command } from 'commander';
import { CloudFormationClient, DeleteStackCommand, DescribeStacksCommand } from '@aws-sdk/client-cloudformation';
import { config } from 'dotenv';
import path from 'path';
import { logger } from './utils/logger';

// Load environment variables from mono-repo root
config({ path: path.resolve(__dirname, '../../.env') });

const program = new Command();
const WAF_REGION = 'us-east-1';

program
  .description('Remove WAF stack directly from us-east-1 region')
  .option('--stage <stage>', 'Deployment stage', 'dev')
  .parse(process.argv);

const options = program.opts();
const stage = options.stage;
const stackName = `nlmonorepo-waf-${stage}`;

async function removeWafStack() {
  logger.info(`Removing WAF stack: ${stackName} from region ${WAF_REGION}`);
  
  try {
    // Create a CloudFormation client specific to us-east-1
    const cfClient = new CloudFormationClient({ region: WAF_REGION });
    
    // Check if stack exists
    try {
      const describeCommand = new DescribeStacksCommand({ StackName: stackName });
      await cfClient.send(describeCommand);
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'ValidationError' && error.message.includes('does not exist')) {
        logger.info(`WAF stack ${stackName} does not exist`);
        return;
      }
      // If it's a different error, or not an Error instance, rethrow or handle as appropriate
      // For now, let the outer catch handle it or rethrow if necessary.
      throw error; 
    }
    
    // Delete the stack
    const command = new DeleteStackCommand({ StackName: stackName });
    await cfClient.send(command);
    
    logger.success(`Delete command sent successfully for ${stackName}`);
    logger.info('Wait for the stack to be deleted in the AWS CloudFormation console');
    logger.info(`Region: ${WAF_REGION}`);
  } catch (error: unknown) {
    logger.error(`Failed to delete WAF stack ${stackName}: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

removeWafStack();
