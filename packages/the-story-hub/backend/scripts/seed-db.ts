import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { v5 as uuidv5, v4 as uuidv4 } from "uuid";

// Configuration
const REGION = process.env.AWS_REGION || "ap-southeast-2";
const TABLE_NAME = process.env.TABLE_NAME || "nlmonorepo-tsh-datatable-dev";
const STAGE = process.env.STAGE || "dev";

// UUID namespace for deterministic UUID generation
const UUID_NAMESPACE = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";

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

// Simple seed data - test users and stories
const SEED_DATA = {
  users: [
    {
      firstName: "Alice",
      lastName: "Admin",
      email: "alice.admin@example.com",
      title: "Ms",
    },
    {
      firstName: "Bob",
      lastName: "User",
      email: "bob.user@example.com",
      title: "Mr",
    },
    {
      firstName: "Charlie",
      lastName: "Smith",
      email: "charlie.smith@example.com",
      title: "Mr",
    },
    {
      firstName: "Diana",
      lastName: "Jones",
      email: "diana.jones@example.com",
      title: "Ms",
    },
  ],
  stories: [
    {
      title: "The Enchanted Forest",
      synopsis: "A young adventurer discovers a magical forest where every choice leads to a different destiny. Navigate through mystical creatures, ancient secrets, and powerful magic as you forge your own path through this collaborative fantasy epic.",
      genre: ["Fantasy", "Adventure"],
      ageRating: "PG",
      contentWarnings: [],
      coverImage: "https://picsum.photos/seed/forest/400/600",
      featured: true,
      authorEmail: "alice.admin@example.com",
      rootChapterContent: "You stand at the edge of an ancient forest. The trees tower above you, their leaves shimmering with an otherworldly glow. A worn path leads into the shadows, while to your right, you notice strange markings carved into a massive oak tree. The air is thick with magic and possibility.\n\nWhat do you do?",
    },
    {
      title: "Cyber Nexus",
      synopsis: "In a dystopian future where consciousness can be uploaded to the net, you must navigate corporate espionage, digital warfare, and the blurred lines between human and AI. Your choices will shape the future of humanity itself.",
      genre: ["Sci-Fi", "Thriller"],
      ageRating: "M",
      contentWarnings: ["Violence"],
      coverImage: "https://picsum.photos/seed/cyber/400/600",
      featured: true,
      authorEmail: "bob.user@example.com",
      rootChapterContent: "The neon-soaked streets of Neo Tokyo stretch before you. Your neural implant buzzes with an incoming message marked urgent. The sender is anonymous, but the encryption key suggests it's from inside Zaibatsu Corp—the very megacorporation you've been hired to infiltrate.\n\n'They know you're coming. Meet me at the old arcade. Come alone.'\n\nDo you trust this mysterious contact?",
    },
    {
      title: "Mystery at Blackwood Manor",
      synopsis: "A classic murder mystery where readers vote on which suspect to investigate next. Uncover clues, interview suspects, and piece together the truth in this interactive detective story set in a remote English manor.",
      genre: ["Mystery", "Thriller"],
      ageRating: "PG-13",
      contentWarnings: ["Violence"],
      coverImage: "https://picsum.photos/seed/manor/400/600",
      featured: false,
      authorEmail: "charlie.smith@example.com",
      rootChapterContent: "The storm rages outside Blackwood Manor as you arrive for what was supposed to be a peaceful weekend retreat. But when the host, Lord Blackwood, is found dead in his study, all the guests become suspects. The phones are down, the bridge is washed out, and the killer is still among you.\n\nYou're a private detective who happened to be among the guests. Where do you begin your investigation?",
    },
    {
      title: "Love in the Time of Dragons",
      synopsis: "A romantic fantasy adventure where a baker falls in love with a dragon shapeshifter. Navigate courtly intrigue, magical mishaps, and the complexities of inter-species romance in this heartwarming tale.",
      genre: ["Romance", "Fantasy"],
      ageRating: "PG-13",
      contentWarnings: [],
      coverImage: "https://picsum.photos/seed/dragons/400/600",
      featured: false,
      authorEmail: "diana.jones@example.com",
      rootChapterContent: "Your bakery in the small village of Thornhaven is known throughout the realm for its legendary cinnamon rolls. But today, an unusual customer walks through the door—tall, mysterious, with eyes that shimmer like molten gold. When they accidentally sneeze and a small puff of smoke escapes, you realize this is no ordinary patron.\n\n'I'll have whatever doesn't contain dragon's bane,' they say with an embarrassed smile.\n\nHow do you respond?",
    },
  ],
};

interface TSHUserDB {
  PK: string;
  SK: string;
  userId: string;
  userEmail: string;
  userTitle: string;
  userFirstName: string;
  userLastName: string;
  userPhone: string;
  privacyPolicy: boolean;
  termsAndConditions: boolean;
  userAddedById: string;
  userCreated: string;
  GSI1PK?: string;
  GSI1SK?: string;
}

// Generate deterministic UUID from email
function generateDeterministicUserId(email: string): string {
  return uuidv5(email, UUID_NAMESPACE);
}

// Generate deterministic phone number
function generateDeterministicPhone(email: string): string {
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = (hash << 5) - hash + email.charCodeAt(i);
    hash = hash & hash;
  }
  const areaCode = 400 + (Math.abs(hash) % 200);
  const prefix = 100 + (Math.abs(hash >> 8) % 900);
  const lineNumber = 1000 + (Math.abs(hash >> 16) % 9000);
  return `+61${areaCode}${prefix}${lineNumber}`;
}

// Create user
function createUser(superAdminUserId: string, userData: any): TSHUserDB {
  const userId = generateDeterministicUserId(userData.email);

  const user: TSHUserDB = {
    PK: `USER#${userId}`,
    SK: `PROFILE#${userId}`,
    userId,
    userEmail: userData.email,
    userTitle: userData.title,
    userFirstName: userData.firstName,
    userLastName: userData.lastName,
    userPhone: generateDeterministicPhone(userData.email),
    privacyPolicy: true,
    termsAndConditions: true,
    userAddedById: superAdminUserId,
    userCreated: new Date().toISOString(),
    GSI1PK: `USER#${userId}`,
    GSI1SK: `USER#${userId}`,
  };

  return user;
}

// Insert user
async function insertUser(user: TSHUserDB): Promise<void> {
  try {
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: user,
      }),
    );
    console.log(`✅ ${user.userFirstName} ${user.userLastName}`);
    console.log(`   🆔 User ID: ${user.userId}`);
    console.log(`   📧 Email: ${user.userEmail}`);
  } catch (error) {
    console.error(
      `❌ Failed to create user ${user.userEmail}:`,
      error instanceof Error ? error.message : error,
    );
    throw error;
  }
}

// Create story with root chapter
function createStory(authorId: string, storyData: any) {
  const storyId = uuidv4();
  const rootNodeId = uuidv4();
  const now = new Date().toISOString();

  const story = {
    PK: `STORY#${storyId}`,
    SK: "METADATA",
    GSI1PK: "STORY",
    GSI1SK: `STORY#${storyId}`,
    storyId,
    authorId,
    title: storyData.title,
    synopsis: storyData.synopsis,
    genre: storyData.genre,
    ageRating: storyData.ageRating,
    contentWarnings: storyData.contentWarnings,
    coverImage: storyData.coverImage,
    featured: storyData.featured || false,
    rootNodeId,
    status: "active",
    createdAt: now,
    updatedAt: now,
    stats: {
      totalReads: Math.floor(Math.random() * 1000) + 50,
      totalBranches: 0,
      totalChapters: 1,
      averageRating: 4.5,
      ratingCount: Math.floor(Math.random() * 50) + 10,
    },
  };

  const rootChapter = {
    PK: `STORY#${storyId}`,
    SK: `CHAPTER#${rootNodeId}`,
    GSI1PK: `STORY#${storyId}`,
    GSI1SK: `CHAPTER#${rootNodeId}`,
    storyId,
    nodeId: rootNodeId,
    chapterNumber: 1,
    authorId,
    content: storyData.rootChapterContent,
    branchDescription: "The beginning",
    parentNodeId: null,
    createdAt: now,
    updatedAt: now,
    status: "active",
    stats: {
      upvotes: Math.floor(Math.random() * 100) + 20,
      downvotes: Math.floor(Math.random() * 10),
      branchCount: 0,
    },
  };

  return { story, rootChapter, storyId, rootNodeId };
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
async function insertItem(item: any, description: string): Promise<void> {
  try {
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: item,
      }),
    );
    console.log(`✅ ${description}`);
  } catch (error) {
    console.error(
      `❌ Failed to create ${description}:`,
      error instanceof Error ? error.message : error,
    );
    throw error;
  }
}

// Main seed function
async function seedDatabase() {
  try {
    if (await tableHasItems()) {
      console.log("ℹ️  Table already contains items — skipping seeding.");
      return;
    }

    console.log(`🌱 Starting The Story Hub database seeding...`);
    console.log(`📍 Region: ${REGION}`);
    console.log(`📊 Table: ${TABLE_NAME}`);
    console.log(`🏷️  Stage: ${STAGE}`);
    console.log("");

    const superAdminUserId =
      process.env.SUPER_ADMIN_USER_ID || "super-admin-fixed-uuid";

    // Map to store user IDs by email
    const userIdMap = new Map<string, string>();

    console.log(`🏗️  Creating ${SEED_DATA.users.length} test users...`);
    console.log("");

    // Create and insert users
    for (const userData of SEED_DATA.users) {
      const user = createUser(superAdminUserId, userData);
      userIdMap.set(userData.email, user.userId);
      await insertUser(user);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log("");
    console.log(`📚 Creating ${SEED_DATA.stories.length} stories with branches...`);
    console.log("");

    let storyCount = 0;
    let chapterCount = 0;

    // Create and insert stories with branches
    for (const storyData of SEED_DATA.stories) {
      const authorId = userIdMap.get(storyData.authorEmail);
      if (!authorId) {
        console.warn(`⚠️  Skipping story "${storyData.title}" - author not found`);
        continue;
      }

      const { story, rootChapter, storyId, rootNodeId } = createStory(
        authorId,
        storyData,
      );

      await insertItem(story, `Story: "${storyData.title}"`);
      storyCount++;
      await new Promise((resolve) => setTimeout(resolve, 100));

      await insertItem(rootChapter, `  Root chapter for "${storyData.title}"`);
      chapterCount++;
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Add 2-3 branches to each story for demo purposes
      const branchCount = Math.floor(Math.random() * 2) + 2;
      const otherUsers = SEED_DATA.users.filter(
        (u) => u.email !== storyData.authorEmail,
      );

      for (let i = 0; i < branchCount; i++) {
        const branchAuthor =
          otherUsers[Math.floor(Math.random() * otherUsers.length)];
        const branchAuthorId = userIdMap.get(branchAuthor.email);
        if (!branchAuthorId) continue;

        const branchChapter = createBranchChapter(
          storyId,
          rootNodeId,
          2,
          branchAuthorId,
          `This is branch ${i + 1} of the story, written by ${branchAuthor.firstName}. The story continues in an exciting new direction...`,
          `Branch ${i + 1}: ${branchAuthor.firstName}'s path`,
        );

        await insertItem(
          branchChapter,
          `  Branch ${i + 1} by ${branchAuthor.firstName}`,
        );
        chapterCount++;
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      console.log("");
    }

    console.log("");
    console.log(`✨ Seeding complete!`);
    console.log(`   ✅ Successfully created:`);
    console.log(`      👥 Users: ${userIdMap.size}`);
    console.log(`      📚 Stories: ${storyCount}`);
    console.log(`      📖 Chapters: ${chapterCount}`);
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
