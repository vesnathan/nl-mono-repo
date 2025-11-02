import { DynamoDBClient, ScanCommand, DeleteItemCommand } from "@aws-sdk/client-dynamodb";
import { execSync } from "child_process";

// Configuration
const REGION = process.env.AWS_REGION || "ap-southeast-2";
const TABLE_NAME = process.env.TABLE_NAME || "nlmonorepo-thestoryhub-datatable-dev";

const ddbClient = new DynamoDBClient({ region: REGION });

async function clearTable() {
  console.log("🗑️  Clearing table...");

  let itemsDeleted = 0;
  let lastEvaluatedKey: any = undefined;

  do {
    const scanParams: any = {
      TableName: TABLE_NAME,
      Limit: 25,
    };

    if (lastEvaluatedKey) {
      scanParams.ExclusiveStartKey = lastEvaluatedKey;
    }

    const scanResult = await ddbClient.send(new ScanCommand(scanParams));

    if (scanResult.Items && scanResult.Items.length > 0) {
      // Delete items in batches
      for (const item of scanResult.Items) {
        await ddbClient.send(new DeleteItemCommand({
          TableName: TABLE_NAME,
          Key: {
            PK: item.PK,
            SK: item.SK,
          },
        }));
        itemsDeleted++;
        if (itemsDeleted % 10 === 0) {
          process.stdout.write(`\r   Deleted ${itemsDeleted} items...`);
        }
      }
    }

    lastEvaluatedKey = scanResult.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  console.log(`\n✅ Deleted ${itemsDeleted} items`);
}

async function runSeedScript() {
  console.log("\n🌱 Running seed script...");
  try {
    execSync("npx ts-node scripts/seed-db.ts", {
      stdio: "inherit",
      cwd: "/home/liqk1ugzoezh5okwywlr_/dev/nl-mono-repo/packages/the-story-hub/backend",
      env: {
        ...process.env,
        DOTENV_CONFIG_PATH: "../../../.env",
      },
    });
    console.log("✅ Seeding completed");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    throw error;
  }
}

async function main() {
  try {
    await clearTable();
    await runSeedScript();
    console.log("\n🎉 Clear and reseed completed successfully");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

main();
