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

// Load environment variables
config();

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
  console.log(`Removing WAF stack: ${stackName} from region ${WAF_REGION}`);
  
  try {
    // Create a CloudFormation client specific to us-east-1
    const cfClient = new CloudFormationClient({ region: WAF_REGION });
    
    // Check if stack exists
    try {
      const describeCommand = new DescribeStacksCommand({ StackName: stackName });
      await cfClient.send(describeCommand);
    } catch (error: any) {
      if (error.name === 'ValidationError' && error.message.includes('does not exist')) {
        console.log(`WAF stack ${stackName} does not exist`);
        return;
      }
    }
    
    // Delete the stack
    const command = new DeleteStackCommand({ StackName: stackName });
    await cfClient.send(command);
    
    console.log(`Delete command sent successfully for ${stackName}`);
    console.log('Wait for the stack to be deleted in the AWS CloudFormation console');
    console.log(`Region: ${WAF_REGION}`);
  } catch (error: any) {
    console.error(`Failed to delete WAF stack ${stackName}: ${error.message}`);
    process.exit(1);
  }
}

removeWafStack();
