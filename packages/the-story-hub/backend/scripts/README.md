# Database Seeding Scripts

This directory contains scripts for seeding the database with **FIXED, DETERMINISTIC** test data.

## 🔒 Important: Deterministic UUIDs

All user IDs are **deterministic** - meaning the same email will **ALWAYS** generate the same UUID. This allows other repos and agents to reference these users predictably.

- UUIDs are generated using **UUIDv5** with a fixed namespace
- Same email → Same UUID (every time)

## seed-db.ts

Seeds the DynamoDB table with simple test users.

### Structure

- **3 Client Types**: SiteAdmin, AuthenticatedUser, UnauthenticatedUser
- **4 Test Users**:
  - 1 SiteAdmin
  - 3 AuthenticatedUser accounts
- All users have deterministic UUIDs based on their email

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
cd packages/the-story-hub/backend/scripts

# Just run it - no parameters needed!
./seed-db.sh
```

#### Using the TypeScript script directly:

```bash
# Set environment variables
export AWS_REGION="ap-southeast-2"
export TABLE_NAME="nlmonorepo-tsh-datatable-dev"
export STAGE="dev"

# Run the script (no parameters needed)
tsx scripts/seed-db.ts
```

### Environment Variables

- `AWS_REGION`: AWS region where your DynamoDB table is located (default: ap-southeast-2)
- `TABLE_NAME`: Name of the DynamoDB table (default: nlmonorepo-tsh-datatable-dev)
- `STAGE`: Deployment stage (default: dev)

### What the script does

The script creates **FIXED** test users with:

- **SiteAdmin**: Administrator with full access
- **AuthenticatedUser**: Regular authenticated users
- **UnauthenticatedUser**: Guest users (not stored in DB, used for Cognito groups)
- All users have:
  - **Deterministic UUIDs** (based on email)
  - Fixed, realistic names and emails
  - Deterministic phone numbers (based on email)
  - Proper DynamoDB keys (PK, SK, GSI1PK, GSI1SK)

### Data is FIXED and REPEATABLE

- Same 4 users every time
- Same UUIDs every time
- **Perfect for cross-repo testing!**

### Example Users

1. **Alice Admin** - alice.admin@example.com (SiteAdmin)
2. **Bob User** - bob.user@example.com (AuthenticatedUser)
3. **Charlie Smith** - charlie.smith@example.com (AuthenticatedUser)
4. **Diana Jones** - diana.jones@example.com (AuthenticatedUser)

### Example Output

```
🌱 Starting AWS Example database seeding...
📍 Region: ap-southeast-2
📊 Table: nlmonorepo-tsh-datatable-dev
🏷️  Stage: dev

🏗️  Creating 4 test users...

💾 Inserting 4 users into DynamoDB...

✅ Alice Admin [SiteAdmin]
   🆔 User ID: a1b2c3d4-...
   📧 Email: alice.admin@example.com

✅ Bob User [AuthenticatedUser]
   🆔 User ID: e5f6g7h8-...
   📧 Email: bob.user@example.com

...

✨ Seeding complete!
   ✅ Successfully created: 4 users
      👥 Users: 4
```

### Cleanup

To remove seeded users, you'll need to delete them individually through AWS Console or create a cleanup script.

### Notes

- The script includes a 100ms delay between insertions to avoid DynamoDB throttling
- All users are created with `privacyPolicy: true` and `termsAndConditions: true`
- Users are created with proper GSI (Global Secondary Index) attributes for user-based queries
- Phone numbers are generated in Australian format (+61...)
- This structure allows for proper user queries and authorization checks

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
