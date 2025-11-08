import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "ap-southeast-2" });
const ddbDocClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME || "nlmonorepo-bjcct-datatable-dev";

const seedUsers = [
  {
    userId: "test-user-1",
    email: "player1@example.com",
    username: "CardShark",
    chips: 10000,
    totalChipsPurchased: 10000,
    earlyAdopter: true,
  },
  {
    userId: "test-user-2",
    email: "player2@example.com",
    username: "DealerBuster",
    chips: 5000,
    totalChipsPurchased: 5000,
    earlyAdopter: false,
  },
  {
    userId: "test-user-3",
    email: "player3@example.com",
    username: "BlackjackPro",
    chips: 25000,
    totalChipsPurchased: 20000,
    earlyAdopter: true,
  },
];

async function seed() {
  console.log(`Seeding users to table: ${TABLE_NAME}`);

  for (const user of seedUsers) {
    const item = {
      PK: `USER#${user.userId}`,
      SK: `USER#${user.userId}`,
      email: user.email,
      username: user.username,
      chips: user.chips,
      totalChipsPurchased: user.totalChipsPurchased,
      patreonInfo: null,
      earlyAdopter: user.earlyAdopter,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await ddbDocClient.send(
        new PutCommand({
          TableName: TABLE_NAME,
          Item: item,
        })
      );
      console.log(`✓ Seeded user: ${user.username} (${user.email})`);
    } catch (error) {
      console.error(`✗ Failed to seed user ${user.username}:`, error);
    }
  }

  console.log("Seeding complete!");
}

seed().catch(console.error);
