import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import * as dotenv from "dotenv";
dotenv.config({ path: "../../../.env" });

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

async function checkComments() {
  const storyId = "59ef2644-3f47-4709-9074-126f57999458";
  const nodeId = "a8e80366-5ab6-4739-a3cf-4325141c237f"; // Root node

  const result = await docClient.send(
    new QueryCommand({
      TableName: "nlmonorepo-thestoryhub-datatable-dev",
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
      ExpressionAttributeValues: {
        ":pk": `STORY#${storyId}#NODE#${nodeId}`,
        ":sk": "COMMENT#",
      },
    }),
  );

  console.log("Total comments on root node:", result.Items?.length);
  console.log("\nComment structure:");
  result.Items?.forEach((item: any) => {
    const topLevel = !item.parentCommentId || item.parentCommentId === null;
    console.log({
      commentId: item.commentId.substring(0, 8),
      depth: item.depth,
      parentCommentId: item.parentCommentId
        ? item.parentCommentId.substring(0, 8)
        : "NULL",
      topLevel,
      content: item.content.substring(0, 60) + "...",
    });
  });

  const topLevelCount = result.Items?.filter(
    (item: any) => !item.parentCommentId || item.parentCommentId === null,
  ).length;
  console.log(`\nTop-level comments: ${topLevelCount}`);
  console.log(
    `Reply comments: ${(result.Items?.length || 0) - (topLevelCount || 0)}`,
  );
}

checkComments().catch(console.error);
