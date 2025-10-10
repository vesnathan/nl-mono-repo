# ✅ AWSB Database Seeding - Complete Setup

## 🎯 What Was Created

### 1. **seed-db.ts** - Main Seeding Script
- Creates **DETERMINISTIC** users and organizations
- Uses **UUIDv5** for consistent, repeatable UUIDs
- Seeds **5 companies** with **~100 users total**
- Structure:
  - 5 Organizations
  - 5 EventCompanyMainAdmins (1 per company)
  - 15 EventCompanyAdmins (3 per company)
  - 75 EventCompanyStaff (5 per admin)

### 2. **seed-db.sh** - Shell Wrapper
- Easy-to-use bash script
- Auto-detects AWS region and table name
- No parameters needed (all data is fixed!)

### 3. **deploy-with-seed.sh** - Deployment Integration
- Deploys AWSB infrastructure
- Optionally seeds database
- Usage: `./deploy-with-seed.sh dev yes`

### 4. **SEED_DATA_REFERENCE.md** - Cross-Repo Reference
- Complete list of all users and emails
- UUID generation examples for other repos
- DynamoDB key structures
- Company and user details

### 5. **README.md** - Documentation
- Complete usage instructions
- Examples and troubleshooting
- Query patterns

## 🔒 Key Features

### Deterministic UUIDs
```typescript
// Same email ALWAYS generates same UUID
const userId = uuidv5('sarah.johnson@eliteevents.com', UUID_NAMESPACE);
// → Always: same-uuid-every-time

// Same company name ALWAYS generates same Org ID  
const orgId = uuidv5('Elite Events Co.', UUID_NAMESPACE);
// → Always: same-org-id-every-time
```

### Fixed Data Structure
- **5 Companies** with real names:
  1. Elite Events Co. (Sarah Johnson)
  2. Premier Productions (James Robertson)
  3. Global Event Solutions (Patricia Nelson)
  4. Stellar Events Group (Mark Harrison)
  5. Dynamic Event Management (Margaret Foster)

- **Hierarchical Structure:**
  ```
  Organization
    └─ EventCompanyMainAdmin
         └─ managedAdminIds: [admin1, admin2, admin3]
              ├─ EventCompanyAdmin 1
              │    └─ managedStaffIds: [staff1, staff2, staff3, staff4, staff5]
              ├─ EventCompanyAdmin 2
              │    └─ managedStaffIds: [...]
              └─ EventCompanyAdmin 3
                   └─ managedStaffIds: [...]
  ```

## 🚀 Usage

### Quick Start
```bash
cd packages/aws-example/backend/scripts
./seed-db.sh
```

### Deploy with Seeding
```bash
./deploy-with-seed.sh dev yes
```

### For Other Repos
```typescript
// Generate the same UUID from an email
import { v5 as uuidv5 } from 'uuid';

const UUID_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
const email = 'sarah.johnson@eliteevents.com';
const userId = uuidv5(email, UUID_NAMESPACE);

// Now you have the EXACT same user ID as in the seeded database!
```

## 📋 DynamoDB Structure

### Organization Record
```json
{
  "PK": "ORG#<organizationId>",
  "SK": "METADATA#<organizationId>",
  "organizationId": "uuid-v5-from-company-name",
  "organizationName": "Elite Events Co.",
  "organizationType": "EventCompany",
  "mainAdminUserId": "uuid-of-main-admin",
  "adminUserIds": ["admin1-uuid", "admin2-uuid", "admin3-uuid"],
  "staffUserIds": ["staff1-uuid", "staff2-uuid", ...],
  "GSI1PK": "ORGTYPE#EventCompany",
  "GSI1SK": "ORG#<organizationId>"
}
```

### User Record
```json
{
  "PK": "USER#<userId>",
  "SK": "PROFILE#<userId>",
  "userId": "uuid-v5-from-email",
  "organizationId": "org-uuid",
  "userEmail": "sarah.johnson@eliteevents.com",
  "userFirstName": "Sarah",
  "userLastName": "Johnson",
  "userType": "EventCompanyMainAdmin",
  "managedAdminIds": ["admin1", "admin2", "admin3"],  // Main admins only
  "managedStaffIds": ["staff1", "staff2", ...],        // Admins only
  "GSI1PK": "ORG#<organizationId>",
  "GSI1SK": "USER#<userId>"
}
```

## 🔍 Query Patterns

```typescript
// Get organization
const org = await ddb.get({
  Key: { PK: `ORG#${orgId}`, SK: `METADATA#${orgId}` }
});

// Get user
const user = await ddb.get({
  Key: { PK: `USER#${userId}`, SK: `PROFILE#${userId}` }
});

// Get all users in an organization
const users = await ddb.query({
  IndexName: 'GSI1',
  KeyConditionExpression: 'GSI1PK = :orgPK AND begins_with(GSI1SK, :userPrefix)',
  ExpressionAttributeValues: {
    ':orgPK': `ORG#${orgId}`,
    ':userPrefix': 'USER#'
  }
});

// Get all Event Companies
const companies = await ddb.query({
  IndexName: 'GSI1',
  KeyConditionExpression: 'GSI1PK = :type',
  ExpressionAttributeValues: {
    ':type': 'ORGTYPE#EventCompany'
  }
});
```

## 📊 Total Counts

- **Organizations:** 5
- **Main Admins:** 5 (1 per company)
- **Admins:** 15 (3 per company)
- **Staff:** 75 (5 per admin)
- **Total Users:** 95
- **Total DynamoDB Items:** 100 (5 orgs + 95 users)

## ✅ Integration Complete

The seeding script is now:
1. ✅ Using deterministic UUIDs
2. ✅ Creating proper organization records
3. ✅ Creating hierarchical user structure (MainAdmin → Admin → Staff)
4. ✅ Using ~100 fixed users with real names
5. ✅ Integrated with deployment process
6. ✅ Cross-repo compatible via email-to-UUID mapping
7. ✅ Fully documented

## 🎉 Ready to Use!

Run `./seed-db.sh` to seed your database with predictable, cross-repo compatible test data!
