/**
 * Migration Script: Change CHAPTER# to NODE# in SK and GSI1SK
 * This script updates all existing chapter records in DynamoDB to use NODE# prefix instead of CHAPTER#
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand,
  DeleteCommand,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";
import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const REGION = process.env.AWS_REGION || "ap-southeast-2";
const TABLE_NAME =
  process.env.DATA_TABLE_NAME || "nlmonorepo-thestoryhub-datatable-dev";

const client = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(client);

async function migrateChapterToNode() {
  console.log(`Starting migration for table: ${TABLE_NAME}`);
  console.log(`Region: ${REGION}`);

  // Scan for all items with SK starting with CHAPTER#
  const scanResult = await docClient.send(
    new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: "begins_with(SK, :sk)",
      ExpressionAttributeValues: {
        ":sk": "CHAPTER#",
      },
    }),
  );

  const items = scanResult.Items || [];
  console.log(`Found ${items.length} items to migrate`);

  if (items.length === 0) {
    console.log("No items to migrate");
    return;
  }

  let successCount = 0;
  let errorCount = 0;

  for (const item of items) {
    try {
      const oldPK = item.PK;
      const oldSK = item.SK;
      const oldGSI1SK = item.GSI1SK;

      // Create new SK and GSI1SK with NODE# prefix
      const newSK = oldSK.replace("CHAPTER#", "NODE#");
      const newGSI1SK = oldGSI1SK ? oldGSI1SK.replace("CHAPTER#", "NODE#") : oldGSI1SK;

      console.log(`Migrating: ${oldSK} -> ${newSK}`);

      // Create new item with updated keys
      const newItem = {
        ...item,
        SK: newSK,
        GSI1SK: newGSI1SK,
      };

      // Delete old item
      await docClient.send(
        new DeleteCommand({
          TableName: TABLE_NAME,
          Key: {
            PK: oldPK,
            SK: oldSK,
          },
        }),
      );

      // Put new item
      await docClient.send(
        new PutCommand({
          TableName: TABLE_NAME,
          Item: newItem,
        }),
      );

      successCount++;
      console.log(`✓ Migrated: ${oldSK} -> ${newSK}`);
    } catch (error) {
      errorCount++;
      console.error(`✗ Error migrating ${item.SK}:`, error);
    }
  }

  console.log("\nMigration complete!");
  console.log(`Successfully migrated: ${successCount}`);
  console.log(`Errors: ${errorCount}`);
}

// Run the migration
migrateChapterToNode().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
