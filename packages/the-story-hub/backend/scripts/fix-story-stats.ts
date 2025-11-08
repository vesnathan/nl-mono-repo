import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import * as dotenv from "dotenv";

dotenv.config({ path: "../../../.env" });

const REGION = process.env.AWS_REGION || "ap-southeast-2";
const TABLE_NAME =
  process.env.TABLE_NAME || "nlmonorepo-thestoryhub-datatable-dev";

const ddbClient = new DynamoDBClient({
  region: REGION,
  ...(process.env.AWS_ENDPOINT_URL && {
    endpoint: process.env.AWS_ENDPOINT_URL,
  }),
});
const docClient = DynamoDBDocumentClient.from(ddbClient);

async function getAllStories() {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "GSI1",
      KeyConditionExpression: "GSI1PK = :pk",
      ExpressionAttributeValues: {
        ":pk": "STORY",
      },
    }),
  );
  return result.Items || [];
}

async function getNodesForStory(storyId: string) {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
      ExpressionAttributeValues: {
        ":pk": `STORY#${storyId}`,
        ":sk": "NODE#",
      },
      ProjectionExpression: "nodeId",
    }),
  );
  return result.Items || [];
}

async function countCommentsForNode(storyId: string, nodeId: string) {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
      ExpressionAttributeValues: {
        ":pk": `STORY#${storyId}#NODE#${nodeId}`,
        ":sk": "COMMENT#",
      },
      Select: "COUNT",
    }),
  );
  return result.Count || 0;
}

async function updateStoryCommentCount(storyId: string, actualCount: number) {
  await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `STORY#${storyId}`,
        SK: "METADATA",
      },
      UpdateExpression: "SET stats.totalComments = :count",
      ExpressionAttributeValues: {
        ":count": actualCount,
      },
    }),
  );
}

async function main() {
  console.log("🔍 Fetching all stories...");
  const stories = await getAllStories();
  console.log(`Found ${stories.length} stories\n`);

  for (const story of stories) {
    const storyId = story.storyId;
    const title = story.title;
    const reportedCount = story.stats?.totalComments || 0;

    console.log(`📖 Checking: ${title}`);
    console.log(`   Story ID: ${storyId}`);
    console.log(`   Reported comments: ${reportedCount}`);

    // Get all nodes
    const nodes = await getNodesForStory(storyId);
    console.log(`   Found ${nodes.length} nodes`);

    // Count actual comments
    let actualCount = 0;
    for (const node of nodes) {
      const nodeCount = await countCommentsForNode(storyId, node.nodeId);
      actualCount += nodeCount;
    }

    console.log(`   Actual comments: ${actualCount}`);

    if (reportedCount !== actualCount) {
      console.log(
        `   ⚠️  MISMATCH! Updating ${reportedCount} → ${actualCount}`,
      );
      await updateStoryCommentCount(storyId, actualCount);
      console.log(`   ✅ Updated successfully`);
    } else {
      console.log(`   ✓ Stats are correct`);
    }
    console.log();
  }

  console.log("✨ All story stats verified and corrected!");
}

main().catch(console.error);
