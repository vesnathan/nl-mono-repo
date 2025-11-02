import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";

// Configuration
const REGION = process.env.AWS_REGION || "ap-southeast-2";
const TABLE_NAME =
  process.env.TABLE_NAME || "nlmonorepo-thestoryhub-datatable-dev";

// Initialize DynamoDB client
const ddbClient = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(ddbClient);

// Get all stories
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

// Get all chapters for a story
async function getChaptersForStory(storyId: string) {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
      ExpressionAttributeValues: {
        ":pk": `STORY#${storyId}`,
        ":sk": "CHAPTER#",
      },
    }),
  );
  return result.Items || [];
}

// Get all users
async function getAllUsers() {
  const result = await docClient.send(
    new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: "begins_with(PK, :pk)",
      ExpressionAttributeValues: {
        ":pk": { S: "USER#" },
      },
    }),
  );

  const items = result.Items || [];
  return items.map((item: any) => ({
    userId: item.userId?.S || "",
    email: item.userEmail?.S || "",
    firstName: item.userFirstName?.S || "",
  }));
}

// Create branch chapter
function createBranchChapter(
  storyId: string,
  parentNodeId: string,
  chapterNumber: number,
  authorId: string,
  content: string,
  branchDescription: string,
) {
  const nodeId = uuidv4();
  const now = new Date().toISOString();

  return {
    PK: `STORY#${storyId}`,
    SK: `CHAPTER#${nodeId}`,
    GSI1PK: `STORY#${storyId}`,
    GSI1SK: `CHAPTER#${nodeId}`,
    storyId,
    nodeId,
    chapterNumber,
    authorId,
    content,
    branchDescription,
    parentNodeId,
    createdAt: now,
    updatedAt: now,
    status: "active",
    stats: {
      upvotes: Math.floor(Math.random() * 50) + 5,
      downvotes: Math.floor(Math.random() * 5),
      branchCount: 0,
    },
  };
}

// Insert item
async function insertItem(item: any): Promise<void> {
  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
    }),
  );
}

// Main function
async function addBranches() {
  try {
    console.log(`🌿 Adding branches to existing stories...`);
    console.log(`📍 Region: ${REGION}`);
    console.log(`📊 Table: ${TABLE_NAME}`);
    console.log("");

    // Get all users
    console.log("👥 Fetching users...");
    const users = await getAllUsers();
    console.log(`   Found ${users.length} users`);
    console.log("");

    // Get all stories
    console.log("📚 Fetching stories...");
    const stories = await getAllStories();
    console.log(`   Found ${stories.length} stories`);
    console.log("");

    let totalChaptersAdded = 0;

    for (const story of stories) {
      console.log(`📖 Processing: "${story.title}"`);
      const storyId = story.storyId;
      const authorId = story.authorId;

      // Get existing chapters
      const existingChapters = await getChaptersForStory(storyId);
      console.log(`   Current chapters: ${existingChapters.length}`);

      // Get root chapter
      const rootChapter = existingChapters.find((ch: any) => !ch.parentNodeId);
      if (!rootChapter) {
        console.log("   ⚠️  No root chapter found, skipping");
        continue;
      }

      const otherUsers = users.filter((u) => u.userId !== authorId);
      if (otherUsers.length === 0) {
        console.log("   ⚠️  No other users available, skipping");
        continue;
      }

      // Add 2-3 first-level branches from root
      const firstLevelBranchCount = Math.floor(Math.random() * 2) + 2;
      const firstLevelBranches: any[] = [];

      for (let i = 0; i < firstLevelBranchCount; i++) {
        const branchAuthor =
          otherUsers[Math.floor(Math.random() * otherUsers.length)];

        const branchChapter = createBranchChapter(
          storyId,
          rootChapter.nodeId,
          2,
          branchAuthor.userId,
          `${branchAuthor.firstName} continues the story with a fresh perspective. New paths emerge as the narrative deepens, revealing hidden layers and unexpected twists...`,
          `${branchAuthor.firstName}'s Path`,
        );

        await insertItem(branchChapter);
        firstLevelBranches.push(branchChapter);
        console.log(`   ✅ Added branch by ${branchAuthor.firstName}`);
        totalChaptersAdded++;
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // Add 1-2 child branches to some first-level branches
      const branchesToExtend = Math.min(2, firstLevelBranches.length);
      const childBranches: any[] = [];

      for (let i = 0; i < branchesToExtend; i++) {
        const parentBranch = firstLevelBranches[i];
        const childBranchCount = Math.floor(Math.random() * 2) + 1;

        for (let j = 0; j < childBranchCount; j++) {
          const branchAuthor =
            otherUsers[Math.floor(Math.random() * otherUsers.length)];

          const branchChapter = createBranchChapter(
            storyId,
            parentBranch.nodeId,
            3,
            branchAuthor.userId,
            `The story takes another turn as ${branchAuthor.firstName} explores what happens next. Tension builds and new possibilities unfold...`,
            `${branchAuthor.firstName}'s Continuation`,
          );

          await insertItem(branchChapter);
          childBranches.push(branchChapter);
          console.log(`   ✅ Added child branch by ${branchAuthor.firstName}`);
          totalChaptersAdded++;
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      // Add 1 deeper nested branch to demonstrate tree depth
      if (childBranches.length > 0) {
        const parentBranch = childBranches[0];
        const branchAuthor =
          otherUsers[Math.floor(Math.random() * otherUsers.length)];

        const branchChapter = createBranchChapter(
          storyId,
          parentBranch.nodeId,
          4,
          branchAuthor.userId,
          `Deep into the narrative, ${branchAuthor.firstName} adds yet another layer. The story spirals in fascinating new directions, proving that every choice opens infinite possibilities...`,
          `${branchAuthor.firstName}'s Deep Dive`,
        );

        await insertItem(branchChapter);
        console.log(`   ✅ Added nested branch by ${branchAuthor.firstName}`);
        totalChaptersAdded++;
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      console.log("");
    }

    console.log(`✨ Complete!`);
    console.log(`   📖 Total new chapters added: ${totalChaptersAdded}`);
    console.log("");
  } catch (error) {
    console.error("❌ Failed:", error);
    process.exit(1);
  }
}

addBranches()
  .then(() => {
    console.log("🎉 Branches added successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Failed:", error);
    process.exit(1);
  });
