import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  BatchWriteCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import {
  SEED_USERS,
  SEED_STORIES,
  SEED_NODES,
  SEED_COMMENTS,
  SEED_SITE_SETTINGS,
} from "../data/seed-data";

// Configuration
const REGION = process.env.AWS_REGION || "ap-southeast-2";
const TABLE_NAME =
  process.env.TABLE_NAME || "nlmonorepo-thestoryhub-datatable-dev";
const STAGE = process.env.STAGE || "dev";
const SUPER_ADMIN_USER_ID =
  process.env.SUPER_ADMIN_USER_ID || "super-admin-fixed-uuid";

// Check for --force flag
const FORCE_RESEED = process.argv.includes("--force");

// Initialize DynamoDB client
const ddbClient = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(ddbClient);

// Check if table already has items
async function tableHasItems(): Promise<boolean> {
  try {
    const resp = await ddbClient.send(
      new ScanCommand({ TableName: TABLE_NAME, Limit: 1 }),
    );
    const count =
      (resp as any).Count ??
      ((resp as any).Items ? (resp as any).Items.length : 0);
    return (count || 0) > 0;
  } catch (err) {
    console.warn(
      "⚠️  Could not check table contents, proceeding with seeding:",
      err instanceof Error ? err.message : err,
    );
    return false;
  }
}

// Get all items from table (for deletion)
async function getAllItems(): Promise<Array<{ PK: string; SK: string }>> {
  const items: Array<{ PK: string; SK: string }> = [];
  let lastEvaluatedKey: any = undefined;

  try {
    do {
      const params: any = {
        TableName: TABLE_NAME,
        ProjectionExpression: "PK, SK",
      };

      if (lastEvaluatedKey) {
        params.ExclusiveStartKey = lastEvaluatedKey;
      }

      const result = await ddbClient.send(new ScanCommand(params));

      if (result.Items) {
        for (const item of result.Items) {
          if (item.PK && item.SK) {
            items.push({
              PK: item.PK.S!,
              SK: item.SK.S!,
            });
          }
        }
      }

      lastEvaluatedKey = result.LastEvaluatedKey;
    } while (lastEvaluatedKey);

    return items;
  } catch (error) {
    console.error("Error scanning table:", error);
    throw error;
  }
}

// Clear all items from table
async function clearTable(): Promise<void> {
  console.log("🗑️  Clearing existing data from table...");

  const items = await getAllItems();

  if (items.length === 0) {
    console.log("   Table is already empty");
    return;
  }

  console.log(`   Found ${items.length} items to delete`);

  // Delete in batches of 25 (DynamoDB limit)
  const BATCH_SIZE = 25;
  const batches = [];

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    batches.push(items.slice(i, i + BATCH_SIZE));
  }

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    const writeRequests = batch.map((item) => ({
      DeleteRequest: {
        Key: item,
      },
    }));

    await docClient.send(
      new BatchWriteCommand({
        RequestItems: {
          [TABLE_NAME]: writeRequests,
        },
      }),
    );

    console.log(
      `   ✅ Deleted batch ${i + 1}/${batches.length} (${batch.length} items)`,
    );
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log(`✅ Successfully cleared ${items.length} items from table`);
  console.log("");
}

// Batch insert items (DynamoDB allows 25 items per batch)
async function batchInsertItems(
  items: any[],
  description: string,
): Promise<void> {
  try {
    const BATCH_SIZE = 25;
    const batches = [];

    // Split items into batches of 25
    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      batches.push(items.slice(i, i + BATCH_SIZE));
    }

    // Process each batch
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const writeRequests = batch.map((item) => ({
        PutRequest: {
          Item: item,
        },
      }));

      await docClient.send(
        new BatchWriteCommand({
          RequestItems: {
            [TABLE_NAME]: writeRequests,
          },
        }),
      );

      console.log(
        `✅ ${description} (batch ${i + 1}/${batches.length}, ${batch.length} items)`,
      );
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  } catch (error) {
    console.error(
      `❌ Failed to batch create ${description}:`,
      error instanceof Error ? error.message : error,
    );
    throw error;
  }
}

// Transform user for DynamoDB format
function transformUserForDB(user: (typeof SEED_USERS)[number]): any {
  const now = new Date().toISOString();
  return {
    PK: `USER#${user.userId}`,
    SK: `PROFILE#${user.userId}`,
    userId: user.userId,
    // GraphQL fields
    username: user.screenName,
    email: user.email,
    createdAt: now,
    stats: {
      storiesCreated: 0,
      branchesContributed: 0,
      totalUpvotes: 0,
    },
    // Legacy fields for backward compatibility
    userEmail: user.email,
    userTitle: user.title || "",
    userFirstName: user.firstName,
    userLastName: user.lastName,
    userScreenName: user.screenName,
    userPhone: user.phone || "",
    privacyPolicy: true,
    termsAndConditions: true,
    userAddedById: SUPER_ADMIN_USER_ID,
    userCreated: now,
    patreonSupporter: user.patreonSupporter ?? false,
    ogSupporter: user.ogSupporter ?? false,
    GSI1PK: `USER#${user.userId}`,
    GSI1SK: `USER#${user.userId}`,
    GSI2PK: `USERNAME#${user.screenName}`,
    GSI2SK: `USER#`,
  };
}

// Transform story for DynamoDB format
function transformStoryForDB(story: (typeof SEED_STORIES)[number]): any {
  return {
    PK: `STORY#${story.storyId}`,
    SK: "METADATA",
    GSI1PK: "STORY",
    GSI1SK: `STORY#${story.storyId}`,
    storyId: story.storyId,
    authorId: story.authorId,
    authorName: story.authorName,
    title: story.title,
    synopsis: story.synopsis,
    genre: story.genre,
    ageRating: story.ageRating,
    contentWarnings: story.contentWarnings || [],
    coverImageUrl: story.coverImageUrl,
    featured: story.featured || false,
    rootNodeId: story.rootNodeId,
    aiCreated: story.aiCreated ?? false,
    allowAI: story.allowAI ?? false,
    status: "active",
    createdAt: story.createdAt,
    updatedAt: story.createdAt,
    stats: story.stats,
  };
}

// Transform node for DynamoDB format
function transformNodeForDB(node: (typeof SEED_NODES)[number]): any {
  return {
    PK: `STORY#${node.storyId}`,
    SK: `NODE#${node.nodeId}`,
    GSI1PK: `USER#${node.authorId}`,
    GSI1SK: `BRANCH#${node.createdAt}#${node.nodeId}`,
    storyId: node.storyId,
    nodeId: node.nodeId,
    chapterNumber: node.chapterNumber,
    authorId: node.authorId,
    authorName: node.authorName,
    content: node.content,
    branchDescription: node.branchDescription || null,
    paragraphIndex: node.paragraphIndex || null,
    parentNodeId: node.parentNodeId || null,
    createdAt: node.createdAt,
    editableUntil: node.editableUntil,
    stats: node.stats,
    badges: node.badges || {},
  };
}

// Transform comment for DynamoDB format
function transformCommentForDB(comment: (typeof SEED_COMMENTS)[number]): any {
  return {
    PK: `STORY#${comment.storyId}#NODE#${comment.nodeId}`,
    SK: `COMMENT#${comment.commentId}`,
    GSI1PK: comment.parentCommentId
      ? `COMMENT#${comment.parentCommentId}`
      : `NODE#${comment.nodeId}`,
    GSI1SK: `CREATED#${comment.createdAt}`,
    commentId: comment.commentId,
    storyId: comment.storyId,
    nodeId: comment.nodeId,
    authorId: comment.authorId,
    authorName: comment.authorName,
    content: comment.content,
    parentCommentId: comment.parentCommentId || null,
    depth: comment.depth,
    createdAt: comment.createdAt,
    updatedAt: comment.createdAt,
    edited: false,
    stats: comment.stats,
    badges: comment.badges || {},
  };
}

// Main seed function
async function seedDatabase() {
  try {
    console.log(`🌱 Starting The Story Hub database seeding...`);
    console.log(`📍 Region: ${REGION}`);
    console.log(`📊 Table: ${TABLE_NAME}`);
    console.log(`🏷️  Stage: ${STAGE}`);
    if (FORCE_RESEED) {
      console.log(`⚠️  Force mode: --force flag detected`);
    }
    console.log("");

    const hasItems = await tableHasItems();

    if (hasItems && !FORCE_RESEED) {
      console.log("ℹ️  Table already contains items — skipping seeding.");
      console.log(
        "ℹ️  Use --force flag to clear and reseed: yarn ts-node seed-db.ts --force",
      );
      return;
    }

    if (hasItems && FORCE_RESEED) {
      await clearTable();
    }

    // Transform and insert users
    console.log(`🏗️  Creating ${SEED_USERS.length} users...`);
    const userItems = SEED_USERS.map(transformUserForDB);
    await batchInsertItems(userItems, "Users");
    console.log("");

    // Create site settings
    console.log(`⚙️  Creating site settings...`);
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: "SETTINGS#SITE",
          SK: "CONFIG#GLOBAL",
          ...SEED_SITE_SETTINGS,
          updatedAt: new Date().toISOString(),
          updatedBy: SUPER_ADMIN_USER_ID,
        },
      }),
    );
    console.log(`✅ Site settings created`);
    console.log("");

    // Transform and insert stories
    console.log(`📚 Creating ${SEED_STORIES.length} stories...`);
    const storyItems = SEED_STORIES.map(transformStoryForDB);
    await batchInsertItems(storyItems, "Stories");
    console.log("");

    // Transform and insert nodes (chapters/branches)
    console.log(`📖 Creating ${SEED_NODES.length} chapters/branches...`);
    const nodeItems = SEED_NODES.map(transformNodeForDB);
    await batchInsertItems(nodeItems, "Chapters");
    console.log("");

    // Transform and insert comments
    console.log(`💬 Creating ${SEED_COMMENTS.length} comments...`);
    const commentItems = SEED_COMMENTS.map(transformCommentForDB);
    await batchInsertItems(commentItems, "Comments");
    console.log("");

    console.log(`✨ Seeding complete!`);
    console.log(`   ✅ Successfully created:`);
    console.log(`      👥 Users: ${SEED_USERS.length}`);
    console.log(`      📚 Stories: ${SEED_STORIES.length}`);
    console.log(`      📖 Chapters: ${SEED_NODES.length}`);
    console.log(`      💬 Comments: ${SEED_COMMENTS.length}`);
    console.log("");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

seedDatabase()
  .then(() => {
    console.log("🎉 Seeding completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Seeding failed:", error);
    process.exit(1);
  });
