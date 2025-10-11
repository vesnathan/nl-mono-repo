import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { v5 as uuidv5 } from "uuid";

// Configuration
const REGION = process.env.AWS_REGION || "ap-southeast-2";
const TABLE_NAME = process.env.TABLE_NAME || "nlmonorepo-awsb-datatable-dev";
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

// Simple seed data - just test users
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
};

interface AWSBUserDB {
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
function createUser(superAdminUserId: string, userData: any): AWSBUserDB {
  const userId = generateDeterministicUserId(userData.email);

  const user: AWSBUserDB = {
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
async function insertUser(user: AWSBUserDB): Promise<void> {
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

// Main seed function
async function seedUsers() {
  try {
    if (await tableHasItems()) {
      console.log("ℹ️  Table already contains items — skipping seeding.");
      return;
    }

    console.log(`🌱 Starting AWS Example database seeding...`);
    console.log(`📍 Region: ${REGION}`);
    console.log(`📊 Table: ${TABLE_NAME}`);
    console.log(`🏷️  Stage: ${STAGE}`);
    console.log("");

    const superAdminUserId =
      process.env.SUPER_ADMIN_USER_ID || "super-admin-fixed-uuid";

    const allItems: AWSBUserDB[] = [];

    console.log(`🏗️  Creating ${SEED_DATA.users.length} test users...`);
    console.log("");

    // Create users
    for (const userData of SEED_DATA.users) {
      const user = createUser(superAdminUserId, userData);
      allItems.push(user);
    }

    // Insert all items
    let successCount = 0;
    let userCount = 0;

    console.log(`💾 Inserting ${allItems.length} users into DynamoDB...`);
    console.log("");

    for (const item of allItems) {
      try {
        await insertUser(item as AWSBUserDB);
        userCount++;
        successCount++;
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error("Failed to insert user:", error);
      }
    }

    console.log("");
    console.log(`✨ Seeding complete!`);
    console.log(`   ✅ Successfully created: ${successCount} users`);
    console.log(`      👥 Users: ${userCount}`);
    console.log("");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

seedUsers()
  .then(() => {
    console.log("🎉 Seeding completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Seeding failed:", error);
    process.exit(1);
  });
