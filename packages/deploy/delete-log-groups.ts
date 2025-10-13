#!/usr/bin/env ts-node

/**
 * Utility script to delete orphaned Lambda CloudWatch LogGroups
 *
 * This script deletes LogGroups that were automatically created by Lambda functions
 * during failed CloudFormation deployments. These orphaned LogGroups prevent
 * CloudFormation from managing them explicitly.
 *
 * Usage:
 *   npx ts-node delete-log-groups.ts
 */

import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
  DeleteLogGroupCommand,
} from "@aws-sdk/client-cloudwatch-logs";

const REGION = "ap-southeast-2";
const LOG_GROUP_PREFIX = "/aws/lambda/nlmonorepo-cwl-";

const client = new CloudWatchLogsClient({ region: REGION });

async function deleteLogGroups() {
  try {
    console.log(`Searching for LogGroups with prefix: ${LOG_GROUP_PREFIX}`);

    const response = await client.send(
      new DescribeLogGroupsCommand({
        logGroupNamePrefix: LOG_GROUP_PREFIX,
      }),
    );

    if (!response.logGroups || response.logGroups.length === 0) {
      console.log("\n✓ No orphaned LogGroups found. You can proceed with deployment.");
      return;
    }

    console.log(`\nFound ${response.logGroups.length} LogGroup(s):`);
    response.logGroups.forEach((lg) => console.log(`  - ${lg.logGroupName}`));

    console.log("\nDeleting orphaned LogGroups...");
    for (const lg of response.logGroups) {
      await client.send(
        new DeleteLogGroupCommand({ logGroupName: lg.logGroupName }),
      );
      console.log(`  ✓ Deleted ${lg.logGroupName}`);
    }

    console.log("\n✓ All orphaned LogGroups deleted successfully!");
    console.log("  You can now redeploy the stack.");
  } catch (error: any) {
    console.error(`\n✗ Error: ${error.message}`);
    process.exit(1);
  }
}

deleteLogGroups();
