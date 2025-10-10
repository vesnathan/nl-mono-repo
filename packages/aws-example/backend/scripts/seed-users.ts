import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { v5 as uuidv5 } from "uuid";

// Configuration
const REGION = process.env.AWS_REGION || "ap-southeast-2";
const TABLE_NAME = process.env.TABLE_NAME || "nlmonorepo-awsb-datatable-dev";
const STAGE = process.env.STAGE || "dev";

// UUID namespace for deterministic UUID generation
// This ensures the same names always generate the same UUIDs
const UUID_NAMESPACE = "6ba7b810-9dad-11d1-80b4-00c04fd430c8"; // Standard DNS namespace

// Initialize DynamoDB client
const ddbClient = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(ddbClient);

// Check whether the target table already contains any items. We perform a
// lightweight Scan with Limit=1 — if any item exists, we assume the table has
// been seeded and skip the expensive seeding process.
async function tableHasItems(): Promise<boolean> {
  try {
    const resp = await ddbClient.send(
      new ScanCommand({ TableName: TABLE_NAME, Limit: 1 }),
    );
    // Some SDK responses use Count, some include Items array
    const count =
      (resp as any).Count ??
      ((resp as any).Items ? (resp as any).Items.length : 0);
    return (count || 0) > 0;
  } catch (err) {
    console.warn(
      "⚠️  Could not check table contents, proceeding with seeding:",
      err instanceof Error ? err.message : err,
    );
    // If we can't determine table contents, do not block seeding — fail open.
    return false;
  }
}

// Fixed seed data structure for predictable testing
interface SeedData {
  companies: {
    name: string;
    mainAdmin: {
      firstName: string;
      lastName: string;
      email: string;
      title: string;
      role: string;
    };
    admins: {
      firstName: string;
      lastName: string;
      email: string;
      title: string;
      role: string;
      staff: {
        firstName: string;
        lastName: string;
        email: string;
        title: string;
        role: string;
      }[];
    }[];
  }[];
}

// FIXED SEED DATA - These are the exact users that will be created every time
const SEED_DATA: SeedData = {
  companies: [
    {
      name: "Elite Events Co.",
      mainAdmin: {
        firstName: "Sarah",
        lastName: "Johnson",
        email: "sarah.johnson@eliteevents.com",
        title: "Ms",
        role: "Chief Operations Officer",
      },
      admins: [
        {
          firstName: "Michael",
          lastName: "Chen",
          email: "michael.chen@eliteevents.com",
          title: "Mr",
          role: "Senior Event Manager",
          staff: [
            {
              firstName: "Emily",
              lastName: "Rodriguez",
              email: "emily.rodriguez@eliteevents.com",
              title: "Ms",
              role: "Event Coordinator",
            },
            {
              firstName: "David",
              lastName: "Kim",
              email: "david.kim@eliteevents.com",
              title: "Mr",
              role: "Event Coordinator",
            },
            {
              firstName: "Jessica",
              lastName: "Patel",
              email: "jessica.patel@eliteevents.com",
              title: "Ms",
              role: "Event Coordinator",
            },
            {
              firstName: "Ryan",
              lastName: "O'Brien",
              email: "ryan.obrien@eliteevents.com",
              title: "Mr",
              role: "Event Coordinator",
            },
            {
              firstName: "Amanda",
              lastName: "Thompson",
              email: "amanda.thompson@eliteevents.com",
              title: "Ms",
              role: "Event Coordinator",
            },
          ],
        },
        {
          firstName: "Jennifer",
          lastName: "Martinez",
          email: "jennifer.martinez@eliteevents.com",
          title: "Ms",
          role: "Event Manager",
          staff: [
            {
              firstName: "Brandon",
              lastName: "Lee",
              email: "brandon.lee@eliteevents.com",
              title: "Mr",
              role: "Event Specialist",
            },
            {
              firstName: "Ashley",
              lastName: "Wilson",
              email: "ashley.wilson@eliteevents.com",
              title: "Ms",
              role: "Event Specialist",
            },
            {
              firstName: "Christopher",
              lastName: "Taylor",
              email: "christopher.taylor@eliteevents.com",
              title: "Mr",
              role: "Event Specialist",
            },
            {
              firstName: "Nicole",
              lastName: "Anderson",
              email: "nicole.anderson@eliteevents.com",
              title: "Ms",
              role: "Event Specialist",
            },
            {
              firstName: "Matthew",
              lastName: "Garcia",
              email: "matthew.garcia@eliteevents.com",
              title: "Mr",
              role: "Event Specialist",
            },
          ],
        },
        {
          firstName: "Robert",
          lastName: "Davis",
          email: "robert.davis@eliteevents.com",
          title: "Mr",
          role: "Event Manager",
          staff: [
            {
              firstName: "Samantha",
              lastName: "Miller",
              email: "samantha.miller@eliteevents.com",
              title: "Ms",
              role: "Event Assistant",
            },
            {
              firstName: "Daniel",
              lastName: "Moore",
              email: "daniel.moore@eliteevents.com",
              title: "Mr",
              role: "Event Assistant",
            },
            {
              firstName: "Lauren",
              lastName: "Jackson",
              email: "lauren.jackson@eliteevents.com",
              title: "Ms",
              role: "Event Assistant",
            },
            {
              firstName: "Joshua",
              lastName: "White",
              email: "joshua.white@eliteevents.com",
              title: "Mr",
              role: "Event Assistant",
            },
            {
              firstName: "Megan",
              lastName: "Harris",
              email: "megan.harris@eliteevents.com",
              title: "Ms",
              role: "Event Assistant",
            },
          ],
        },
      ],
    },
    {
      name: "Premier Productions",
      mainAdmin: {
        firstName: "James",
        lastName: "Robertson",
        email: "james.robertson@premierproductions.com",
        title: "Mr",
        role: "Managing Director",
      },
      admins: [
        {
          firstName: "Catherine",
          lastName: "Hughes",
          email: "catherine.hughes@premierproductions.com",
          title: "Ms",
          role: "Production Manager",
          staff: [
            {
              firstName: "Andrew",
              lastName: "Foster",
              email: "andrew.foster@premierproductions.com",
              title: "Mr",
              role: "Production Coordinator",
            },
            {
              firstName: "Rachel",
              lastName: "Bennett",
              email: "rachel.bennett@premierproductions.com",
              title: "Ms",
              role: "Production Coordinator",
            },
            {
              firstName: "Kevin",
              lastName: "Murphy",
              email: "kevin.murphy@premierproductions.com",
              title: "Mr",
              role: "Production Coordinator",
            },
            {
              firstName: "Stephanie",
              lastName: "Collins",
              email: "stephanie.collins@premierproductions.com",
              title: "Ms",
              role: "Production Coordinator",
            },
            {
              firstName: "Tyler",
              lastName: "Ward",
              email: "tyler.ward@premierproductions.com",
              title: "Mr",
              role: "Production Coordinator",
            },
          ],
        },
        {
          firstName: "Elizabeth",
          lastName: "Cooper",
          email: "elizabeth.cooper@premierproductions.com",
          title: "Ms",
          role: "Production Manager",
          staff: [
            {
              firstName: "Nathan",
              lastName: "Reed",
              email: "nathan.reed@premierproductions.com",
              title: "Mr",
              role: "Production Assistant",
            },
            {
              firstName: "Victoria",
              lastName: "Bailey",
              email: "victoria.bailey@premierproductions.com",
              title: "Ms",
              role: "Production Assistant",
            },
            {
              firstName: "Justin",
              lastName: "Richardson",
              email: "justin.richardson@premierproductions.com",
              title: "Mr",
              role: "Production Assistant",
            },
            {
              firstName: "Olivia",
              lastName: "Cox",
              email: "olivia.cox@premierproductions.com",
              title: "Ms",
              role: "Production Assistant",
            },
            {
              firstName: "Zachary",
              lastName: "Howard",
              email: "zachary.howard@premierproductions.com",
              title: "Mr",
              role: "Production Assistant",
            },
          ],
        },
        {
          firstName: "William",
          lastName: "Brooks",
          email: "william.brooks@premierproductions.com",
          title: "Mr",
          role: "Production Manager",
          staff: [
            {
              firstName: "Hannah",
              lastName: "Sullivan",
              email: "hannah.sullivan@premierproductions.com",
              title: "Ms",
              role: "Production Specialist",
            },
            {
              firstName: "Alexander",
              lastName: "Perry",
              email: "alexander.perry@premierproductions.com",
              title: "Mr",
              role: "Production Specialist",
            },
            {
              firstName: "Madison",
              lastName: "Powell",
              email: "madison.powell@premierproductions.com",
              title: "Ms",
              role: "Production Specialist",
            },
            {
              firstName: "Ethan",
              lastName: "Long",
              email: "ethan.long@premierproductions.com",
              title: "Mr",
              role: "Production Specialist",
            },
            {
              firstName: "Sophia",
              lastName: "Patterson",
              email: "sophia.patterson@premierproductions.com",
              title: "Ms",
              role: "Production Specialist",
            },
          ],
        },
      ],
    },
    {
      name: "Global Event Solutions",
      mainAdmin: {
        firstName: "Patricia",
        lastName: "Nelson",
        email: "patricia.nelson@globalevents.com",
        title: "Ms",
        role: "Executive Director",
      },
      admins: [
        {
          firstName: "Thomas",
          lastName: "Mitchell",
          email: "thomas.mitchell@globalevents.com",
          title: "Mr",
          role: "Operations Manager",
          staff: [
            {
              firstName: "Emma",
              lastName: "Roberts",
              email: "emma.roberts@globalevents.com",
              title: "Ms",
              role: "Operations Coordinator",
            },
            {
              firstName: "Jacob",
              lastName: "Turner",
              email: "jacob.turner@globalevents.com",
              title: "Mr",
              role: "Operations Coordinator",
            },
            {
              firstName: "Abigail",
              lastName: "Phillips",
              email: "abigail.phillips@globalevents.com",
              title: "Ms",
              role: "Operations Coordinator",
            },
            {
              firstName: "Benjamin",
              lastName: "Campbell",
              email: "benjamin.campbell@globalevents.com",
              title: "Mr",
              role: "Operations Coordinator",
            },
            {
              firstName: "Isabella",
              lastName: "Parker",
              email: "isabella.parker@globalevents.com",
              title: "Ms",
              role: "Operations Coordinator",
            },
          ],
        },
        {
          firstName: "Linda",
          lastName: "Evans",
          email: "linda.evans@globalevents.com",
          title: "Ms",
          role: "Operations Manager",
          staff: [
            {
              firstName: "Nicholas",
              lastName: "Edwards",
              email: "nicholas.edwards@globalevents.com",
              title: "Mr",
              role: "Operations Assistant",
            },
            {
              firstName: "Charlotte",
              lastName: "Stewart",
              email: "charlotte.stewart@globalevents.com",
              title: "Ms",
              role: "Operations Assistant",
            },
            {
              firstName: "Logan",
              lastName: "Sanchez",
              email: "logan.sanchez@globalevents.com",
              title: "Mr",
              role: "Operations Assistant",
            },
            {
              firstName: "Ava",
              lastName: "Morris",
              email: "ava.morris@globalevents.com",
              title: "Ms",
              role: "Operations Assistant",
            },
            {
              firstName: "Mason",
              lastName: "Rogers",
              email: "mason.rogers@globalevents.com",
              title: "Mr",
              role: "Operations Assistant",
            },
          ],
        },
        {
          firstName: "Richard",
          lastName: "Cook",
          email: "richard.cook@globalevents.com",
          title: "Mr",
          role: "Operations Manager",
          staff: [
            {
              firstName: "Grace",
              lastName: "Morgan",
              email: "grace.morgan@globalevents.com",
              title: "Ms",
              role: "Operations Specialist",
            },
            {
              firstName: "Lucas",
              lastName: "Bell",
              email: "lucas.bell@globalevents.com",
              title: "Mr",
              role: "Operations Specialist",
            },
            {
              firstName: "Chloe",
              lastName: "Murphy",
              email: "chloe.murphy@globalevents.com",
              title: "Ms",
              role: "Operations Specialist",
            },
            {
              firstName: "Henry",
              lastName: "Rivera",
              email: "henry.rivera@globalevents.com",
              title: "Mr",
              role: "Operations Specialist",
            },
            {
              firstName: "Lily",
              lastName: "Cooper",
              email: "lily.cooper@globalevents.com",
              title: "Ms",
              role: "Operations Specialist",
            },
          ],
        },
      ],
    },
    {
      name: "Stellar Events Group",
      mainAdmin: {
        firstName: "Mark",
        lastName: "Harrison",
        email: "mark.harrison@stellarevents.com",
        title: "Mr",
        role: "CEO",
      },
      admins: [
        {
          firstName: "Angela",
          lastName: "Peterson",
          email: "angela.peterson@stellarevents.com",
          title: "Ms",
          role: "Event Director",
          staff: [
            {
              firstName: "Connor",
              lastName: "Gray",
              email: "connor.gray@stellarevents.com",
              title: "Mr",
              role: "Event Planner",
            },
            {
              firstName: "Natalie",
              lastName: "Ramirez",
              email: "natalie.ramirez@stellarevents.com",
              title: "Ms",
              role: "Event Planner",
            },
            {
              firstName: "Aaron",
              lastName: "James",
              email: "aaron.james@stellarevents.com",
              title: "Mr",
              role: "Event Planner",
            },
            {
              firstName: "Zoe",
              lastName: "Watson",
              email: "zoe.watson@stellarevents.com",
              title: "Ms",
              role: "Event Planner",
            },
            {
              firstName: "Dylan",
              lastName: "Brooks",
              email: "dylan.brooks@stellarevents.com",
              title: "Mr",
              role: "Event Planner",
            },
          ],
        },
        {
          firstName: "Barbara",
          lastName: "Kelly",
          email: "barbara.kelly@stellarevents.com",
          title: "Ms",
          role: "Event Director",
          staff: [
            {
              firstName: "Ian",
              lastName: "Sanders",
              email: "ian.sanders@stellarevents.com",
              title: "Mr",
              role: "Event Consultant",
            },
            {
              firstName: "Ella",
              lastName: "Price",
              email: "ella.price@stellarevents.com",
              title: "Ms",
              role: "Event Consultant",
            },
            {
              firstName: "Cameron",
              lastName: "Bennett",
              email: "cameron.bennett@stellarevents.com",
              title: "Mr",
              role: "Event Consultant",
            },
            {
              firstName: "Aria",
              lastName: "Wood",
              email: "aria.wood@stellarevents.com",
              title: "Ms",
              role: "Event Consultant",
            },
            {
              firstName: "Gavin",
              lastName: "Barnes",
              email: "gavin.barnes@stellarevents.com",
              title: "Mr",
              role: "Event Consultant",
            },
          ],
        },
        {
          firstName: "Charles",
          lastName: "Ross",
          email: "charles.ross@stellarevents.com",
          title: "Mr",
          role: "Event Director",
          staff: [
            {
              firstName: "Layla",
              lastName: "Henderson",
              email: "layla.henderson@stellarevents.com",
              title: "Ms",
              role: "Event Technician",
            },
            {
              firstName: "Caleb",
              lastName: "Coleman",
              email: "caleb.coleman@stellarevents.com",
              title: "Mr",
              role: "Event Technician",
            },
            {
              firstName: "Riley",
              lastName: "Jenkins",
              email: "riley.jenkins@stellarevents.com",
              title: "Ms",
              role: "Event Technician",
            },
            {
              firstName: "Wyatt",
              lastName: "Perry",
              email: "wyatt.perry@stellarevents.com",
              title: "Mr",
              role: "Event Technician",
            },
            {
              firstName: "Scarlett",
              lastName: "Powell",
              email: "scarlett.powell@stellarevents.com",
              title: "Ms",
              role: "Event Technician",
            },
          ],
        },
      ],
    },
    {
      name: "Dynamic Event Management",
      mainAdmin: {
        firstName: "Margaret",
        lastName: "Foster",
        email: "margaret.foster@dynamicevents.com",
        title: "Ms",
        role: "President",
      },
      admins: [
        {
          firstName: "Steven",
          lastName: "Butler",
          email: "steven.butler@dynamicevents.com",
          title: "Mr",
          role: "Senior Manager",
          staff: [
            {
              firstName: "Evelyn",
              lastName: "Simmons",
              email: "evelyn.simmons@dynamicevents.com",
              title: "Ms",
              role: "Project Lead",
            },
            {
              firstName: "Christian",
              lastName: "Foster",
              email: "christian.foster@dynamicevents.com",
              title: "Mr",
              role: "Project Lead",
            },
            {
              firstName: "Aubrey",
              lastName: "Russell",
              email: "aubrey.russell@dynamicevents.com",
              title: "Ms",
              role: "Project Lead",
            },
            {
              firstName: "Hunter",
              lastName: "Griffin",
              email: "hunter.griffin@dynamicevents.com",
              title: "Mr",
              role: "Project Lead",
            },
            {
              firstName: "Addison",
              lastName: "Diaz",
              email: "addison.diaz@dynamicevents.com",
              title: "Ms",
              role: "Project Lead",
            },
          ],
        },
        {
          firstName: "Nancy",
          lastName: "Hayes",
          email: "nancy.hayes@dynamicevents.com",
          title: "Ms",
          role: "Senior Manager",
          staff: [
            {
              firstName: "Landon",
              lastName: "Hayes",
              email: "landon.hayes@dynamicevents.com",
              title: "Mr",
              role: "Team Member",
            },
            {
              firstName: "Paisley",
              lastName: "Myers",
              email: "paisley.myers@dynamicevents.com",
              title: "Ms",
              role: "Team Member",
            },
            {
              firstName: "Bentley",
              lastName: "Ford",
              email: "bentley.ford@dynamicevents.com",
              title: "Mr",
              role: "Team Member",
            },
            {
              firstName: "Skylar",
              lastName: "Hamilton",
              email: "skylar.hamilton@dynamicevents.com",
              title: "Ms",
              role: "Team Member",
            },
            {
              firstName: "Easton",
              lastName: "Graham",
              email: "easton.graham@dynamicevents.com",
              title: "Mr",
              role: "Team Member",
            },
          ],
        },
        {
          firstName: "Paul",
          lastName: "Reynolds",
          email: "paul.reynolds@dynamicevents.com",
          title: "Mr",
          role: "Senior Manager",
          staff: [
            {
              firstName: "Brooklyn",
              lastName: "Sullivan",
              email: "brooklyn.sullivan@dynamicevents.com",
              title: "Ms",
              role: "Support Staff",
            },
            {
              firstName: "Nolan",
              lastName: "Wallace",
              email: "nolan.wallace@dynamicevents.com",
              title: "Mr",
              role: "Support Staff",
            },
            {
              firstName: "Claire",
              lastName: "Woods",
              email: "claire.woods@dynamicevents.com",
              title: "Ms",
              role: "Support Staff",
            },
            {
              firstName: "Adrian",
              lastName: "Cole",
              email: "adrian.cole@dynamicevents.com",
              title: "Mr",
              role: "Support Staff",
            },
            {
              firstName: "Violet",
              lastName: "West",
              email: "violet.west@dynamicevents.com",
              title: "Ms",
              role: "Support Staff",
            },
          ],
        },
      ],
    },
  ],
};

// Attempt to load developer mock users (package-local) and, if present,
// convert them into the SeedData.companies shape so we can use the same
// seeding logic. This lets deploy-time seeding use the shared mock files.
function loadMockCompaniesFromDevMocks(): SeedData["companies"] | null {
  try {
    // Use path relative to this script
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const path = require("path");
    const fs = require("fs");
    const mockPath = path.resolve(__dirname, "../../dev-mocks/mockUsers.json");
    if (!fs.existsSync(mockPath)) return null;
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mockUsers = require(mockPath) as Array<any>;
    if (!Array.isArray(mockUsers) || mockUsers.length === 0) return null;

    // Group users by company
    const byCompany: Record<string, any[]> = {};
    for (const u of mockUsers) {
      const company = u.company || "Independent";
      byCompany[company] = byCompany[company] || [];
      byCompany[company].push(u);
    }

    const companies: SeedData["companies"] = [];
    for (const [companyName, users] of Object.entries(byCompany)) {
      // Simple rules to create hierarchy:
      // - First user => mainAdmin
      // - Second user => admin
      // - Remaining users => staff assigned to the admin (if present)
      const mainAdminUser = users[0];
      const adminUsers = users.length > 1 ? [users[1]] : [];
      const staffForAdmin = users.length > 2 ? users.slice(2) : [];

      const admins = adminUsers.map((a) => ({
        firstName: a.firstName || a.firstName || "",
        lastName: a.lastName || a.lastName || "",
        email: a.email,
        title: a.title || "Mr",
        role: a.role || "Event Company Admin",
        staff: staffForAdmin.map((s) => ({
          firstName: s.firstName,
          lastName: s.lastName,
          email: s.email,
          title: s.title || "Ms",
          role: s.role || "Event Company Staff",
        })),
      }));

      companies.push({
        name: companyName,
        mainAdmin: {
          firstName: mainAdminUser.firstName,
          lastName: mainAdminUser.lastName,
          email: mainAdminUser.email,
          title: mainAdminUser.title || "Ms",
          role: mainAdminUser.role || "EventCompanyMainAdmin",
        },
        admins,
      });
    }

    return companies;
  } catch (err) {
    // If anything fails, fallback to hard-coded SEED_DATA
    return null;
  }
}

interface OrganizationDB {
  PK: string;
  SK: string;
  organizationId: string;
  organizationName: string;
  organizationType: "EventCompany" | "TechCompany";
  organizationCreated: string;
  mainAdminUserId: string;
  adminUserIds: string[];
  staffUserIds: string[];
  GSI1PK?: string;
  GSI1SK?: string;
}

interface AWSBUserDB {
  PK: string;
  SK: string;
  userId: string;
  organizationId: string;
  userEmail: string;
  userTitle: string;
  userFirstName: string;
  userLastName: string;
  userPhone: string;
  userRole: string;
  privacyPolicy: boolean;
  termsAndConditions: boolean;
  userAddedById: string;
  userCreated: string;
  userType: "EventCompanyMainAdmin" | "EventCompanyAdmin" | "EventCompanyStaff";
  managedAdminIds?: string[];
  managedStaffIds?: string[];
  GSI1PK?: string;
  GSI1SK?: string;
}

// Generate deterministic UUID from email
function generateDeterministicUserId(email: string): string {
  return uuidv5(email, UUID_NAMESPACE);
}

// Generate deterministic UUID from organization name
function generateDeterministicOrgId(orgName: string): string {
  return uuidv5(orgName, UUID_NAMESPACE);
}

// Generate deterministic phone number from email
function generateDeterministicPhone(email: string): string {
  // Use hash of email to generate consistent phone number
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = (hash << 5) - hash + email.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  const areaCode = 400 + (Math.abs(hash) % 200);
  const prefix = 100 + (Math.abs(hash >> 8) % 900);
  const lineNumber = 1000 + (Math.abs(hash >> 16) % 9000);
  return `+61${areaCode}${prefix}${lineNumber}`;
}

// Create an organization object
function createOrganization(
  companyData: (typeof SEED_DATA.companies)[0],
  mainAdminUserId: string,
  adminUserIds: string[],
  staffUserIds: string[],
): OrganizationDB {
  const organizationId = generateDeterministicOrgId(companyData.name);

  return {
    PK: `ORG#${organizationId}`,
    SK: `METADATA#${organizationId}`,
    organizationId,
    organizationName: companyData.name,
    organizationType: "EventCompany",
    organizationCreated: new Date().toISOString(),
    mainAdminUserId,
    adminUserIds,
    staffUserIds,
    GSI1PK: `ORGTYPE#EventCompany`,
    GSI1SK: `ORG#${organizationId}`,
  };
}

// Create a AWSB user object
function createAWSBUser(
  superAdminUserId: string,
  organizationId: string,
  userData: any,
  userType: "EventCompanyMainAdmin" | "EventCompanyAdmin" | "EventCompanyStaff",
  managedAdminIds?: string[],
  managedStaffIds?: string[],
): AWSBUserDB {
  const userId = generateDeterministicUserId(userData.email);

  const user: AWSBUserDB = {
    PK: `USER#${userId}`,
    SK: `PROFILE#${userId}`,
    userId,
    organizationId,
    userEmail: userData.email,
    userTitle: userData.title,
    userFirstName: userData.firstName,
    userLastName: userData.lastName,
    userPhone: generateDeterministicPhone(userData.email),
    userRole: userData.role,
    privacyPolicy: true,
    termsAndConditions: true,
    userAddedById: superAdminUserId,
    userCreated: new Date().toISOString(),
    userType,
    GSI1PK: `ORG#${organizationId}`,
    GSI1SK: `USER#${userId}`,
  };

  if (managedAdminIds && managedAdminIds.length > 0) {
    user.managedAdminIds = managedAdminIds;
  }

  if (managedStaffIds && managedStaffIds.length > 0) {
    user.managedStaffIds = managedStaffIds;
  }

  return user;
}

// Insert an organization into DynamoDB
async function insertOrganization(org: OrganizationDB): Promise<void> {
  try {
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: org,
      }),
    );
    console.log(`🏢 Created organization: ${org.organizationName}`);
    console.log(`   🆔 Org ID: ${org.organizationId}`);
    console.log(
      `   👔 Main Admin: 1, 👥 Admins: ${org.adminUserIds.length}, 👤 Staff: ${org.staffUserIds.length}`,
    );
  } catch (error) {
    console.error(
      `❌ Failed to create organization ${org.organizationName}:`,
      error instanceof Error ? error.message : error,
    );
    throw error;
  }
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
    const userTypeLabel = user.userType ? ` [${user.userType}]` : "";
    const adminInfo = user.managedAdminIds
      ? ` (managing ${user.managedAdminIds.length} admins)`
      : "";
    const staffInfo = user.managedStaffIds
      ? ` (managing ${user.managedStaffIds.length} staff)`
      : "";
    console.log(
      `✅ ${user.userFirstName} ${user.userLastName}${userTypeLabel}${adminInfo}${staffInfo}`,
    );
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
    console.log(`🔒 Using fixed UUIDs and names for cross-repo compatibility`);
    console.log("");

    const superAdminUserId =
      process.env.SUPER_ADMIN_USER_ID || "super-admin-fixed-uuid";

    const allItems: (OrganizationDB | AWSBUserDB)[] = [];
    const userRegistry: { [email: string]: string } = {}; // Email to UUID mapping

    let totalMainAdmins = 0;
    let totalAdmins = 0;
    let totalStaff = 0;

    console.log(
      `🏗️  Building ${SEED_DATA.companies.length} Event Companies with fixed data...`,
    );
    console.log("");

    // Process each company
    for (const companyData of SEED_DATA.companies) {
      console.log(`🏢 ${companyData.name}`);

      const organizationId = generateDeterministicOrgId(companyData.name);

      const adminIds: string[] = [];
      const allStaffIds: string[] = [];

      // Create admins and their staff
      for (const adminData of companyData.admins) {
        // Create staff for this admin
        const staffIds: string[] = [];

        for (const staffData of adminData.staff) {
          const staffUser = createAWSBUser(
            superAdminUserId,
            organizationId,
            staffData,
            "EventCompanyStaff",
          );
          allItems.push(staffUser);
          staffIds.push(staffUser.userId);
          allStaffIds.push(staffUser.userId);
          userRegistry[staffData.email] = staffUser.userId;
          totalStaff++;
        }

        // Create admin with references to their staff
        const adminUser = createAWSBUser(
          superAdminUserId,
          organizationId,
          adminData,
          "EventCompanyAdmin",
          undefined,
          staffIds,
        );
        allItems.push(adminUser);
        adminIds.push(adminUser.userId);
        userRegistry[adminData.email] = adminUser.userId;
        totalAdmins++;
      }

      // Create main admin with references to all admins
      const mainAdminUser = createAWSBUser(
        superAdminUserId,
        organizationId,
        companyData.mainAdmin,
        "EventCompanyMainAdmin",
        adminIds,
        undefined,
      );
      allItems.push(mainAdminUser);
      userRegistry[companyData.mainAdmin.email] = mainAdminUser.userId;
      totalMainAdmins++;

      // Create the organization
      const organization = createOrganization(
        companyData,
        mainAdminUser.userId,
        adminIds,
        allStaffIds,
      );
      allItems.unshift(organization); // Add org at the beginning

      console.log(`  🆔 Org ID: ${organizationId}`);
      console.log(
        `  🏆 Main Admin: ${companyData.mainAdmin.firstName} ${companyData.mainAdmin.lastName}`,
      );
      console.log(`     📧 ${companyData.mainAdmin.email}`);
      console.log(`     🆔 ${mainAdminUser.userId}`);
      console.log(
        `  👔 ${companyData.admins.length} Admins, 👥 ${allStaffIds.length} Staff`,
      );
      console.log("");
    }

    // Insert all items
    let successCount = 0;
    let failureCount = 0;
    let orgCount = 0;
    let userCount = 0;

    console.log(`💾 Inserting ${allItems.length} items into DynamoDB...`);
    console.log("");

    for (const item of allItems) {
      try {
        if ("organizationName" in item) {
          await insertOrganization(item as OrganizationDB);
          orgCount++;
        } else {
          await insertUser(item as AWSBUserDB);
          userCount++;
        }
        successCount++;
        // Small delay to avoid throttling
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        failureCount++;
      }
    }

    console.log("");
    console.log(`✨ Seeding complete!`);
    console.log(`   ✅ Successfully created: ${successCount} items`);
    console.log(`      🏢 Organizations: ${orgCount}`);
    console.log(`      👥 Users: ${userCount}`);
    if (failureCount > 0) {
      console.log(`   ❌ Failed: ${failureCount} items`);
    }
    console.log("");
    console.log(`📊 Final Summary:`);
    console.log(`   🏢 Event Companies: ${SEED_DATA.companies.length}`);
    console.log(`   🏆 Main Admins: ${totalMainAdmins}`);
    console.log(`   👔 Admins: ${totalAdmins}`);
    console.log(`   👥 Staff: ${totalStaff}`);
    console.log(`   📋 Total Users: ${userCount}`);
    console.log(`   🏗️  Total Items: ${allItems.length}`);
    console.log("");
    console.log(`📋 User Registry (Email → UUID):`);
    console.log(`   Save this for cross-repo reference!`);
    console.log("");
    Object.entries(userRegistry).forEach(([email, uuid]) => {
      console.log(`   ${email} → ${uuid}`);
    });
    console.log("");
    console.log(`💡 NoSQL Query Patterns:`);
    console.log(
      `   • Get Organization: PK="ORG#<orgId>" AND SK="METADATA#<orgId>"`,
    );
    console.log(`   • Get User: PK="USER#<userId>" AND SK="PROFILE#<userId>"`);
    console.log(
      `   • Get Users by Org: GSI1PK="ORG#<orgId>" AND begins_with(GSI1SK, "USER#")`,
    );
    console.log(`   • Get All Event Companies: GSI1PK="ORGTYPE#EventCompany"`);
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

// --- Additional: seed events using dev-mocks/mockEvents.json ---
async function seedEvents() {
  try {
    // Resolve path relative to this script file
    // eslint-disable-next-line node/no-unsupported-features/es-builtins
    const path = require("path");
    const eventsPath = path.resolve(
      __dirname,
      "../../dev-mocks/mockEvents.json",
    );
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mockEvents = require(eventsPath) as Array<any>;

    if (!Array.isArray(mockEvents) || mockEvents.length === 0) {
      console.log("No mock events found to seed.");
      return;
    }

    console.log(`🌱 Seeding ${mockEvents.length} mock events to DynamoDB...`);

    let seeded = 0;
    for (const me of mockEvents) {
      // Derive deterministic owner userId from email
      const ownerEmail = me.eventOwnerEmail || me.eventOwner?.email;
      const ownerId = ownerEmail
        ? generateDeterministicUserId(ownerEmail)
        : undefined;

      const eventItem = {
        PK: `EVENT#${me.id}`,
        SK: `METADATA#${me.id}`,
        eventId: String(me.id),
        title: me.title,
        shortDescription: me.shortDescription || null,
        description: me.description || null,
        location: me.location || null,
        date: me.date || null,
        accessType: me.accessType || null,
        requiresRegistration: !!me.requiresRegistration,
        isLive: !!me.isLive,
        price: me.price || null,
        image: me.image || null,
        eventOwnerId: ownerId ? ownerId : null,
        eventOwnerEmail: ownerEmail || null,
        ticketInfo: me.ticketInfo || null,
        streamUrl: me.streamUrl || null,
        sessions: me.sessions || null,
        createdAt: new Date().toISOString(),
      };

      try {
        await docClient.send(
          new PutCommand({ TableName: TABLE_NAME, Item: eventItem }),
        );
        seeded++;
        console.log(
          `   ✅ Seeded event ${me.id} (owner: ${ownerEmail || "none"})`,
        );
      } catch (err) {
        console.error(
          `   ❌ Failed to seed event ${me.id}:`,
          err instanceof Error ? err.message : err,
        );
      }

      // small delay
      await new Promise((r) => setTimeout(r, 50));
    }

    console.log(`✨ Seeded ${seeded}/${mockEvents.length} events.`);
  } catch (err) {
    console.error(
      "❌ seedEvents failed:",
      err instanceof Error ? err.message : err,
    );
  }
}

// Run both user seed and event seed in sequence
seedUsers()
  .then(() => seedEvents())
  .then(() => {
    console.log("🎉 All seeding completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Seeding failed:", error);
    process.exit(1);
  });
