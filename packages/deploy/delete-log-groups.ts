#!/usr/bin/env ts-node

/**
 * Utility script to delete orphaned CloudWatch LogGroups
 *
 * This script deletes LogGroups that were automatically created by Lambda/AppSync
 * during failed CloudFormation deployments. These orphaned LogGroups prevent
 * CloudFormation from managing them explicitly.
 *
 * Usage:
 *   npx ts-node delete-log-groups.ts [stackName] [region]
 *
 * Examples:
 *   npx ts-node delete-log-groups.ts cwl dev
 *   npx ts-node delete-log-groups.ts awse dev ap-southeast-2
 */

import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
  DeleteLogGroupCommand,
} from "@aws-sdk/client-cloudwatch-logs";

// Parse command line arguments
const args = process.argv.slice(2);
const appName = args[0] || "cwl";
const stage = args[1] || "dev";
const region = args[2] || "ap-southeast-2";

const client = new CloudWatchLogsClient({ region });

async function deleteLogGroups() {
  try {
    // Search for both Lambda and AppSync LogGroups
    const prefixes = [
      `/aws/lambda/nlmonorepo-${appName}-`,
      `/aws/appsync/apis/`,
    ];

    let allLogGroups: string[] = [];

    for (const prefix of prefixes) {
      console.log(`Searching for LogGroups with prefix: ${prefix}`);

      const response = await client.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: prefix,
        }),
      );

      if (response.logGroups && response.logGroups.length > 0) {
        // Filter to only include LogGroups for this stack
        const filtered = response.logGroups
          .map((lg) => lg.logGroupName!)
          .filter((name) =>
            prefix.includes("lambda")
              ? name.includes(`nlmonorepo-${appName}-`)
              : name.includes(stage),
          );
        allLogGroups.push(...filtered);
      }
    }

    if (allLogGroups.length === 0) {
      console.log(
        "\n✓ No orphaned LogGroups found. You can proceed with deployment.",
      );
      return 0;
    }

    console.log(`\nFound ${allLogGroups.length} LogGroup(s):`);
    allLogGroups.forEach((name) => console.log(`  - ${name}`));

    console.log("\nDeleting orphaned LogGroups...");
    for (const logGroupName of allLogGroups) {
      try {
        await client.send(new DeleteLogGroupCommand({ logGroupName }));
        console.log(`  ✓ Deleted ${logGroupName}`);
      } catch (err: any) {
        if (err.name === "ResourceNotFoundException") {
          console.log(`  ⊘ Already deleted: ${logGroupName}`);
        } else {
          throw err;
        }
      }
    }

    console.log("\n✓ All orphaned LogGroups deleted successfully!");
    console.log("  You can now redeploy the stack.");
    return 0;
  } catch (error: any) {
    console.error(`\n✗ Error: ${error.message}`);
    return 1;
  }
}

deleteLogGroups().then((code) => process.exit(code));
