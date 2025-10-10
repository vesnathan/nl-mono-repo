# CWL Seed Data Reference

This file contains the FIXED, DETERMINISTIC seed data used across all repos.
All UUIDs are generated using UUIDv5 (deterministic) based on email addresses.

## UUID Generation

```typescript
import { v5 as uuidv5 } from 'uuid';
const UUID_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'; // Standard DNS namespace

// Generate user ID from email
function generateUserId(email: string): string {
  return uuidv5(email, UUID_NAMESPACE);
}

// Generate org ID from company name
function generateOrgId(companyName: string): string {
  return uuidv5(companyName, UUID_NAMESPACE);
}
```

## Organizations

| Company Name | Organization ID |
|---|---|
| Elite Events Co. | `e3f4b5c6-d7e8-5f90-a1b2-c3d4e5f67890` (generated from name) |
| Premier Productions | `a1b2c3d4-e5f6-5789-0abc-def012345678` (generated from name) |
| Global Event Solutions | `1234abcd-5678-5ef0-1234-567890abcdef` (generated from name) |
| Stellar Events Group | `fedcba98-7654-5321-0fed-cba987654321` (generated from name) |
| Dynamic Event Management | `abcd1234-efgh-5678-ijkl-9012mnop3456` (generated from name) |

## Sample Users (use the email to generate UUID)

###Elite Events Co.

**Main Admin:**
- Email: `sarah.johnson@eliteevents.com`
- UUID: Generate via `uuidv5('sarah.johnson@eliteevents.com', UUID_NAMESPACE)`

**Admins:**
- `michael.chen@eliteevents.com`
- `jennifer.martinez@eliteevents.com`
- `robert.davis@eliteevents.com`

**Sample Staff:**
- `emily.rodriguez@eliteevents.com`
- `david.kim@eliteevents.com`
- `jessica.patel@eliteevents.com`
- ... (15 staff total, 5 per admin)

### Premier Productions

**Main Admin:**
- Email: `james.robertson@premierproductions.com`

**Admins:**
- `catherine.hughes@premierproductions.com`
- `elizabeth.cooper@premierproductions.com`
- `william.brooks@premierproductions.com`

**Sample Staff:**
- `andrew.foster@premierproductions.com`
- `rachel.bennett@premierproductions.com`
- `kevin.murphy@premierproductions.com`
- ... (15 staff total, 5 per admin)

### Global Event Solutions

**Main Admin:**
- Email: `patricia.nelson@globalevents.com`

**Admins:**
- `thomas.mitchell@globalevents.com`
- `linda.evans@globalevents.com`
- `richard.cook@globalevents.com`

**Sample Staff:**
- `emma.roberts@globalevents.com`
- `jacob.turner@globalevents.com`
- `abigail.phillips@globalevents.com`
- ... (15 staff total, 5 per admin)

### Stellar Events Group

**Main Admin:**
- Email: `mark.harrison@stellarevents.com`

**Admins:**
- `angela.peterson@stellarevents.com`
- `barbara.kelly@stellarevents.com`
- `charles.ross@stellarevents.com`

**Sample Staff:**
- `connor.gray@stellarevents.com`
- `natalie.ramirez@stellarevents.com`
- `aaron.james@stellarevents.com`
- ... (15 staff total, 5 per admin)

### Dynamic Event Management

**Main Admin:**
- Email: `margaret.foster@dynamicevents.com`

**Admins:**
- `steven.butler@dynamicevents.com`
- `nancy.hayes@dynamicevents.com`
- `paul.reynolds@dynamicevents.com`

**Sample Staff:**
- `evelyn.simmons@dynamicevents.com`
- `christian.foster@dynamicevents.com`
- `aubrey.russell@dynamicevents.com`
- ... (15 staff total, 5 per admin)

## Total Counts

- **Organizations:** 5
- **Main Admins:** 5
- **Admins:** 15 (3 per company)
- **Staff:** 75 (5 per admin)
- **Total Users:** 95

## Usage in Other Repos

```typescript
// Example: Get Elite Events Main Admin UUID
import { v5 as uuidv5 } from 'uuid';

const UUID_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
const mainAdminEmail = 'sarah.johnson@eliteevents.com';
const mainAdminUserId = uuidv5(mainAdminEmail, UUID_NAMESPACE);

console.log(mainAdminUserId); // Always the same UUID
```

## DynamoDB Keys

### Organization
- **PK:** `ORG#<organizationId>`
- **SK:** `METADATA#<organizationId>`
- **GSI1PK:** `ORGTYPE#EventCompany`
- **GSI1SK:** `ORG#<organizationId>`

### User
- **PK:** `USER#<userId>`
- **SK:** `PROFILE#<userId>`
- **GSI1PK:** `ORG#<organizationId>`
- **GSI1SK:** `USER#<userId>`

## Fields

### Organization Fields
- `organizationId` - UUID (deterministic from name)
- `organizationName` - Company name
- `organizationType` - "EventCompany"
- `mainAdminUserId` - UUID of main admin
- `adminUserIds` - Array of admin UUIDs
- `staffUserIds` - Array of staff UUIDs
- `organizationCreated` - ISO timestamp

### User Fields
- `userId` - UUID (deterministic from email)
- `organizationId` - UUID of organization
- `userEmail` - Email address (unique)
- `userFirstName` - First name
- `userLastName` - Last name
- `userTitle` - Mr/Mrs/Ms/Dr/Prof
- `userPhone` - Phone number (deterministic from email)
- `userRole` - Job role/title
- `userType` - "EventCompanyMainAdmin" | "EventCompanyAdmin" | "EventCompanyStaff"
- `managedAdminIds` - Array of admin UUIDs (main admins only)
- `managedStaffIds` - Array of staff UUIDs (admins only)
- `privacyPolicy` - boolean (always true for seed data)
- `termsAndConditions` - boolean (always true for seed data)
- `userAddedById` - UUID of creator
- `userCreated` - ISO timestamp

## Running the Seed Script

```bash
cd packages/cloudwatchlive/backend/scripts
./seed-db.sh
```

No parameters needed! The script will create exactly the same data every time.
