import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { v5 as uuidv5 } from "uuid";

// Configuration
const REGION = process.env.AWS_REGION || "ap-southeast-2";
const TABLE_NAME = process.env.TABLE_NAME || "nlmonorepo-awse-datatable-dev";
const STAGE = process.env.STAGE || "dev";

// UUID namespace for deterministic UUID generation
const UUID_NAMESPACE = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";

// Initialize DynamoDB client
const ddbClient = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(ddbClient);

// Check whether the target table already contains any items
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

// Seed data with simple user list
const SEED_DATA = {
  users: [
    {
      firstName: "Alice",
      lastName: "Administrator",
      email: "alice.admin@example.com",
      title: "Ms",
    },
    {
      firstName: "Bob",
      lastName: "Smith",
      email: "bob.smith@example.com",
      title: "Mr",
    },
    {
      firstName: "Carol",
      lastName: "Johnson",
      email: "carol.johnson@example.com",
      title: "Ms",
    },
    {
      firstName: "David",
      lastName: "Williams",
      email: "david.williams@example.com",
      title: "Mr",
    },
    {
      firstName: "Emma",
      lastName: "Brown",
      email: "emma.brown@example.com",
      title: "Ms",
    },
    {
      firstName: "Frank",
      lastName: "Davis",
      email: "frank.davis@example.com",
      title: "Mr",
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

// Generate deterministic phone number from email
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

// Create a user object
function createAWSBUser(superAdminUserId: string, userData: any): AWSBUserDB {
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

// Insert a user into DynamoDB
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
    // If table already contains items, skip seeding to avoid duplicates
    if (await tableHasItems()) {
      console.log("ℹ️  Table already contains items — skipping seeding.");
      return;
    }
    console.log(`🌱 Starting DETERMINISTIC user seeding process...`);
    console.log(`📍 Region: ${REGION}`);
    console.log(`📊 Table: ${TABLE_NAME}`);
    console.log(`🏷️  Stage: ${STAGE}`);
    console.log(`🔒 Using fixed UUIDs for cross-repo compatibility`);
    console.log("");

    const superAdminUserId =
      process.env.SUPER_ADMIN_USER_ID || "super-admin-fixed-uuid";

    const allItems: AWSBUserDB[] = [];
    const userRegistry: { [email: string]: string } = {};

    console.log(`🏗️  Building ${SEED_DATA.users.length} test users...`);
    console.log("");

    // Create users
    for (const userData of SEED_DATA.users) {
      const user = createAWSBUser(superAdminUserId, userData);
      allItems.push(user);
      userRegistry[userData.email] = user.userId;
    }

    // Insert all items
    let successCount = 0;
    let failureCount = 0;

    console.log(`💾 Inserting ${allItems.length} users into DynamoDB...`);
    console.log("");

    for (const item of allItems) {
      try {
        await insertUser(item as AWSBUserDB);
        successCount++;
        // Small delay to avoid throttling
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        failureCount++;
      }
    }

    console.log("");
    console.log(`✨ Seeding complete!`);
    console.log(`   ✅ Successfully created: ${successCount} users`);
    if (failureCount > 0) {
      console.log(`   ❌ Failed: ${failureCount} users`);
    }
    console.log("");
    console.log(`📋 User Registry (Email → UUID):`);
    console.log(`   Save this for cross-repo reference!`);
    console.log("");
    Object.entries(userRegistry).forEach(([email, uuid]) => {
      console.log(`   ${email} → ${uuid}`);
    });
    console.log("");
    console.log(`💡 NoSQL Query Patterns:`);
    console.log(`   • Get User: PK="USER#<userId>" AND SK="PROFILE#<userId>"`);
    console.log("");
    console.log(`🔒 IMPORTANT: All UUIDs are deterministic!`);
    console.log(`   The same email will ALWAYS generate the same UUID.`);
    console.log(
      `   Other repos can use the email to generate the matching UUID.`,
    );
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

// Run user seeding
seedUsers()
  .then(() => {
    console.log("🎉 All seeding completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Seeding failed:", error);
    process.exit(1);
  });
