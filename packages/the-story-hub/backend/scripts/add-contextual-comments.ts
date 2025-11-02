import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";

const REGION = process.env.AWS_REGION || "ap-southeast-2";
const TABLE_NAME =
  process.env.TABLE_NAME || "nlmonorepo-thestoryhub-datatable-dev";

const client = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(client);

// Get users
async function getUsers() {
  const result = await docClient.send(
    new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: "begins_with(PK, :pk)",
      ExpressionAttributeValues: {
        ":pk": "USER#",
      },
    }),
  );

  return (
    result.Items?.map((u) => ({
      userId: u.userId,
      username: u.username,
    })) || []
  );
}

// Transcendence story comments - contextual to the sci-fi theme
const transcendenceComments = [
  {
    nodeId: "59ef2644-3f47-4709-9074-126f57999458", // Root node
    comments: [
      {
        content:
          "The concept of a 4.4 billion year old message is absolutely mind-blowing. Hard sci-fi at its finest!",
        replies: [
          {
            content:
              "Right? The zircon crystal detail shows real research went into this.",
          },
          {
            content:
              "I love that it's not aliens but Earth's FIRST civilization. That twist!",
          },
        ],
      },
      {
        content:
          "Alice's internal conflict feels so real. Any scientist would be terrified and thrilled at the same time.",
        replies: [
          {
            content:
              "The 'once she made this call, no turning back' moment gave me chills.",
          },
        ],
      },
    ],
  },
  {
    nodeId: "c9545626-c029-4aee-ad41-da4591a6f32e", // Consult Scientific Community
    comments: [
      {
        content:
          "Smart choice! Scientific verification is crucial for something this monumental.",
        replies: [
          {
            content:
              "Agreed. One person can't handle a discovery that rewrites human history.",
          },
          {
            content: "Plus it protects her from accusations of fraud later on.",
          },
        ],
      },
    ],
  },
  {
    nodeId: "8b934c84-17bb-4d6f-bd25-c5df5bfb5c4f", // Decrypt Immediately
    comments: [
      {
        content:
          "The quantum computing angle is perfect. This is what MIT's labs are actually working on!",
        replies: [
          {
            content:
              "I know right? The technical accuracy makes it so immersive.",
          },
        ],
      },
      {
        content:
          "Alice's urgency vs Marcus's caution creates great tension. Both have valid points.",
        replies: [
          {
            content:
              "That's what makes this choice so compelling - no obvious 'right' answer.",
          },
        ],
      },
    ],
  },
];

async function main() {
  console.log("🚀 Adding contextual comments to Transcendence story...\n");

  const users = await getUsers();
  if (users.length === 0) {
    console.error("❌ No users found in database");
    return;
  }

  const storyId = "7c7a2acf-e115-49b4-bf79-8915bd39c2cc"; // Transcendence

  for (const node of transcendenceComments) {
    console.log(
      `📝 Adding comments for node ${node.nodeId.substring(0, 8)}...`,
    );

    for (const commentData of node.comments) {
      // Create top-level comment
      const user = users[Math.floor(Math.random() * users.length)];
      const commentId = uuidv4();
      const timestamp = new Date().toISOString();

      const comment = {
        PK: `STORY#${storyId}#NODE#${node.nodeId}`,
        SK: `COMMENT#${commentId}`,
        GSI1PK: `USER#${user.userId}`,
        GSI1SK: `COMMENT#${timestamp}`,
        commentId,
        storyId,
        nodeId: node.nodeId,
        authorId: user.userId,
        authorName: user.username,
        content: commentData.content,
        parentCommentId: null,
        depth: 0,
        createdAt: timestamp,
        updatedAt: timestamp,
        edited: false,
        stats: {
          upvotes: Math.floor(Math.random() * 20) + 5,
          downvotes: Math.floor(Math.random() * 3),
          replyCount: 0,
          totalReplyCount: 0,
        },
      };

      await docClient.send(
        new PutCommand({
          TableName: TABLE_NAME,
          Item: comment,
        }),
      );

      console.log(
        `  ✅ Created comment: "${commentData.content.substring(0, 50)}..."`,
      );

      // Create replies
      for (const replyData of commentData.replies || []) {
        const replyUser = users[Math.floor(Math.random() * users.length)];
        const replyId = uuidv4();
        const replyTimestamp = new Date().toISOString();

        const reply = {
          PK: `STORY#${storyId}#NODE#${node.nodeId}`,
          SK: `COMMENT#${replyId}`,
          GSI1PK: `USER#${replyUser.userId}`,
          GSI1SK: `COMMENT#${replyTimestamp}`,
          commentId: replyId,
          storyId,
          nodeId: node.nodeId,
          authorId: replyUser.userId,
          authorName: replyUser.username,
          content: replyData.content,
          parentCommentId: commentId,
          depth: 1,
          createdAt: replyTimestamp,
          updatedAt: replyTimestamp,
          edited: false,
          stats: {
            upvotes: Math.floor(Math.random() * 15) + 3,
            downvotes: Math.floor(Math.random() * 2),
            replyCount: 0,
            totalReplyCount: 0,
          },
        };

        await docClient.send(
          new PutCommand({
            TableName: TABLE_NAME,
            Item: reply,
          }),
        );

        console.log(`    ↳ Reply: "${replyData.content.substring(0, 50)}..."`);
      }
    }
  }

  console.log("\n✅ Done!");
}

main().catch(console.error);
