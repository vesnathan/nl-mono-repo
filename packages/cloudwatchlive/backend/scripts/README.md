# Database Seeding Scripts

This directory contains scripts for seeding the database with **FIXED, DETERMINISTIC** test data.

## 🔒 Important: Deterministic UUIDs

All user and organization IDs are **deterministic** - meaning the same email/name will **ALWAYS** generate the same UUID. This allows other repos and agents to reference these users predictably.

- UUIDs are generated using **UUIDv5** with a fixed namespace
- Same email → Same UUID (every time)
- Same company name → Same Org ID (every time)

## seed-db.ts

Seeds the DynamoDB table with 5 Event Companies containing ~100 users total (all with fixed names and emails).

### Structure

- **5 Event Companies**
  - Each has 1 **EventCompanyMainAdmin**
  - Each has 3 **EventCompanyAdmins**
  - Each Admin manages 5 **EventCompanyStaff**
  - **Total: 95 users** (5 main admins + 15 admins + 75 staff)

### Prerequisites

- AWS credentials configured
- AWS CLI installed
- Either `tsx` or `ts-node` installed globally

Install tsx (recommended):

```bash
yarn global add tsx
```

Or ts-node:

```bash
yarn global add ts-node
```

### Usage

#### Using the shell script (easiest):

```bash
cd packages/cloudwatchlive/backend/scripts

# Just run it - no parameters needed!
./seed-db.sh
```

#### Using the TypeScript script directly:

```bash
# Set environment variables
export AWS_REGION="ap-southeast-2"
export TABLE_NAME="nlmonorepo-shared-usertable-dev"
export STAGE="dev"

# Run the script (no parameters needed)
tsx scripts/seed-db.ts
```

### Deploy with Seeding

To deploy CWL and automatically seed the database:

```bash
cd packages/cloudwatchlive/backend/scripts

# Deploy and seed
./deploy-with-seed.sh dev yes

# Deploy without seeding
./deploy-with-seed.sh dev no
```

### Environment Variables

- `AWS_REGION`: AWS region where your DynamoDB table is located (default: ap-southeast-2)
- `TABLE_NAME`: Name of the DynamoDB table (default: nlmonorepo-shared-usertable-dev)
- `STAGE`: Deployment stage (default: dev)

### What the script does

The script creates **FIXED** Event Company organizational structures with:

- **Organizations**: Separate DynamoDB records for each company
- **Event Company Main Admins**: Top-level admins with `managedAdminIds` array
- **Event Company Admins**: Mid-level admins with `managedStaffIds` array
- **Event Company Staff**: Individual staff members
- All users have:
  - **Deterministic UUIDs** (based on email)
  - Fixed, realistic names and emails
  - Deterministic phone numbers (based on email)
  - Proper DynamoDB keys (PK, SK, GSI1PK, GSI1SK)
  - `userType` field indicating their role level

### Data is FIXED and REPEATABLE

- Same 5 companies every time
- Same 95 users every time
- Same UUIDs every time
- **Perfect for cross-repo testing!**

### Example Companies

1. **Elite Events Co.** - Sarah Johnson (Main Admin)
2. **Premier Productions** - James Robertson (Main Admin)
3. **Global Event Solutions** - Patricia Nelson (Main Admin)
4. **Stellar Events Group** - Mark Harrison (Main Admin)
5. **Dynamic Event Management** - Margaret Foster (Main Admin)

See `SEED_DATA_REFERENCE.md` for complete list of all users and their emails.

### Example Output

```
🌱 Starting user seeding process...
📍 Region: ap-southeast-2
📊 Table: nlmonorepo-shared-usertable-dev
🏷️  Stage: dev

🏢 Creating 2 Event Companies
👥 Each admin will manage 3 staff members
👤 Super Admin User ID: 12345678-1234-1234-1234-123456789abc

🏢 Creating Event Company 1: a1b2c3d4-...
  👔 Admin: James Smith (james.smith@example.com)
    👤 Staff: Emma Johnson (emma.johnson@test.com)
    👤 Staff: Michael Williams (michael.williams@demo.com)
    👤 Staff: Olivia Brown (olivia.brown@acme.com)

🏢 Creating Event Company 2: e5f6g7h8-...
  👔 Admin: William Jones (william.jones@example.com)
    👤 Staff: Sophia Garcia (sophia.garcia@test.com)
    👤 Staff: John Miller (john.miller@demo.com)
    👤 Staff: Isabella Davis (isabella.davis@acme.com)

💾 Inserting 8 users into DynamoDB...

✅ Created user: Emma Johnson (emma.johnson@test.com) [EventCompanyStaff]
✅ Created user: Michael Williams (michael.williams@demo.com) [EventCompanyStaff]
✅ Created user: Olivia Brown (olivia.brown@acme.com) [EventCompanyStaff]
✅ Created user: James Smith (james.smith@example.com) [EventCompanyAdmin] (managing 3 staff)
✅ Created user: Sophia Garcia (sophia.garcia@test.com) [EventCompanyStaff]
✅ Created user: John Miller (john.miller@demo.com) [EventCompanyStaff]
✅ Created user: Isabella Davis (isabella.davis@acme.com) [EventCompanyStaff]
✅ Created user: William Jones (william.jones@example.com) [EventCompanyAdmin] (managing 3 staff)

✨ Seeding complete!
   ✅ Successfully created: 8 users

� Summary:
   🏢 Event Companies: 2
   👔 Admins: 2
   👥 Staff: 6
   📋 Total Users: 8

🏢 Event Companies Created:

   Company 1 (a1b2c3d4-...):
     👔 Admin: admin-id-1 (james.smith@example.com)
        Manages 3 staff:
          - staff-id-1 (emma.johnson@test.com)
          - staff-id-2 (michael.williams@demo.com)
          - staff-id-3 (olivia.brown@acme.com)

   Company 2 (e5f6g7h8-...):
     👔 Admin: admin-id-2 (william.jones@example.com)
        Manages 3 staff:
          - staff-id-4 (sophia.garcia@test.com)
          - staff-id-5 (john.miller@demo.com)
          - staff-id-6 (isabella.davis@acme.com)
```

### Cleanup

To remove seeded users, you'll need to delete them individually through AWS Console or create a cleanup script.

### Notes

- The script includes a 100ms delay between insertions to avoid DynamoDB throttling
- All users are created with `privacyPolicy: true` and `termsAndConditions: true`
- Users are created with proper GSI (Global Secondary Index) attributes for organization-based queries
- Phone numbers are generated in Australian format (+61...)
- **Event Company Admins** have a `managedStaffIds` field containing an array of their staff member user IDs
- **Event Company Staff** have a `userType` field set to "EventCompanyStaff"
- Each Event Company has a unique `organizationId` shared by its admin and all staff members
- This structure allows for proper hierarchical queries and authorization checks

### Troubleshooting

**Error: AWS credentials not configured**

```bash
aws configure
# or
export AWS_ACCESS_KEY_ID="..."
export AWS_SECRET_ACCESS_KEY="..."
```

**Error: Neither tsx nor ts-node found**

```bash
npm install -g tsx
```

**Error: Table not found**

- Verify the table name matches your deployment
- Check the AWS region is correct
- Ensure you have permissions to write to the table
