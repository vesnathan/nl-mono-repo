# Claude Development Session Notes

## Project Conventions

### Package Manager

- **ALWAYS use `yarn` exclusively** - never use npm
- Examples: `yarn install`, `yarn add`, `yarn workspace <name> <command>`

### Git Commit Process

- **ALWAYS run these commands BEFORE staging and committing**:
  1. `yarn lint` - Run linter to check for code style issues
  2. `npx tsc --noEmit` - Type check TypeScript without emitting files
  3. Format with Prettier if available
- Only proceed with `git add` and `git commit` after all checks pass
- This ensures code quality and catches errors before deployment
- Never skip these steps even for "simple" changes

### Deployments

- **NEVER run deployments automatically under ANY circumstances**
- **NEVER use the Bash tool to run `yarn deploy:tsh:dev` or any deployment commands**
- **NEVER run `yarn ts-node index.ts` in the deploy package**
- **If a deployment is accidentally started, IMMEDIATELY kill it with `pkill -f "yarn ts-node index.ts"`**
- Always ask the user to run deploys manually
- Deployment command: `yarn deploy:tsh:dev` (USER RUNS THIS, NOT CLAUDE)
- This rule has been violated multiple times - it is CRITICAL to follow this
- **Database seeding runs AUTOMATICALLY during deployment** - do NOT tell user to reseed after deploy

#### Lambda Functions

- Lambda functions are located in: `packages/the-story-hub/backend/lambdas/` (note the 's')
- Deploy script looks for Lambda directory at: `packages/deploy/packages/the-story-hub/deploy.ts` (line 638)
- **CRITICAL**: The path must be `../../../the-story-hub/backend/lambdas` (with 's')
- Lambda functions are compiled and uploaded to S3 during deployment
- Missing Lambda functions in S3 will cause CloudFormation stack creation to fail

### Seed Data Pattern

- **Single source of truth**: All seed data lives in `packages/the-story-hub/backend/data/seed-data.ts`
- **Hardcoded UUIDs**: All IDs are predefined constants, never generated
- **Frontend imports from backend**: Frontend imports seed data via `packages/the-story-hub/frontend/src/lib/seed-data.ts` (which re-exports from backend)
- **Seed script imports all data**: `packages/the-story-hub/backend/scripts/seed-db.ts` must import and use data from `seed-data.ts`
- **Why this matters**: Local development data must match live database exactly so URLs/IDs work consistently
- **NEVER generate UUIDs in seed script**: Always use the hardcoded IDs from `seed-data.ts`

### Patreon Supporter Tiers & Benefits

When implementing features, always check if they should be gated by Patreon tier:

- **NONE** (Non-supporter):
  - Basic site access
  - Can read and contribute to stories

- **BRONZE** ($3/month):
  - Ad-free experience across the site

- **SILVER** ($5/month):
  - Ad-free experience
  - Early access to new features
  - **Custom bio** on profile
  - **Profile page** with user info and activity
  - **Favorite authors** feature
  - **Custom tags/interests**

- **GOLD** ($10/month):
  - All SILVER benefits, plus:
  - Exclusive Discord role and access
  - **Profile visibility settings** (public/private)
  - **Show/hide statistics on profile**

- **PLATINUM** ($20/month):
  - All GOLD benefits, plus:
  - Vote on new feature development
  - Display Patreon creator page link on profile & contributions
  - Priority support

**Implementation Notes**:
- Patreon tier is stored in `User.patreonInfo.tier` (enum: NONE, BRONZE, SILVER, GOLD, PLATINUM)
- Always check tier before showing premium features in UI
- Backend resolvers must verify tier for protected mutations/queries
- Frontend should gracefully show "upgrade" prompts for unavailable features

---

## Technical Architecture Notes

### Adding New GraphQL Queries, Mutations, and Subscriptions

**IMPORTANT**: When adding new GraphQL operations, follow this exact process:

1. **Define the GraphQL Schema** in `packages/the-story-hub/backend/schema/`:

   - Create a new `.graphql` file or add to existing one
   - Define types, inputs, queries, mutations
   - Use `extend type Query/Mutation/Subscription` for new operations

2. **Create Backend Resolvers** in `packages/the-story-hub/backend/resolvers/`:

   - Follow pattern: `<domain>/<type>/<Type>.<operationName>.ts`
   - Import types from `gqlTypes` (e.g., `import { MyType } from "gqlTypes"`)
   - This is the standard pattern - don't define types inline!

3. **Register Resolver in AppSync Config** at `packages/deploy/templates/the-story-hub/resources/AppSync/appsync.yaml`:

   - Add `AWS::AppSync::Resolver` or `AWS::AppSync::FunctionConfiguration` resource
   - Without this, resolver won't be deployed!

4. **Define Frontend GraphQL Operations** in `packages/the-story-hub/frontend/src/graphql/`:

   - Create a new file (e.g., `settings.ts`) or add to existing
   - Define operations as template strings with `/* GraphQL */` comment
   - Example:
     ```typescript
     export const getMyData = /* GraphQL */ `
       query GetMyData($id: ID!) {
         getMyData(id: $id) {
           field1
           field2
         }
       }
     `;
     ```

5. **Generate TypeScript Types**:

   - Run `yarn build-gql` in the frontend package
   - This merges schemas, generates `gqlTypes.ts` with ALL types
   - Amplify codegen scans `src/graphql/**/*.ts` for operations
   - Types are generated in `src/types/gqlTypes.ts`

6. **Create Frontend API Functions** in `packages/the-story-hub/frontend/src/lib/api/`:
   - Import the GraphQL operation from step 4
   - Import generated types from `@/types/gqlTypes`
   - Create Zod schemas in `src/types/` for validation if needed
   - Use `client.graphql()` to execute operations

**Common Mistakes to Avoid**:

- ❌ Defining GraphQL operations inline in API files (Amplify codegen won't see them)
- ❌ Forgetting to run `yarn build-gql` after schema changes
- ❌ Not registering resolvers in `appsync.yaml`
- ❌ Defining types inline in backend resolvers instead of using `gqlTypes`

### AppSync Resolvers

- Located in: `packages/the-story-hub/backend/resolvers/`
- Structure: `<domain>/<type>/<Type>.<fieldName>.ts`
  - Queries: `<domain>/Queries/Query.<queryName>.ts`
  - Mutations: `<domain>/Mutations/Mutation.<mutationName>.ts`
  - Fields: `<domain>/Fields/<Type>.<fieldName>.ts`
  - Functions: `<domain>/Functions/Function.<functionName>.ts` (for pipeline resolvers)
- Configuration: `packages/deploy/templates/the-story-hub/resources/AppSync/appsync.yaml`
- **CRITICAL**: Creating a resolver TypeScript file is NOT enough - it MUST be registered in appsync.yaml
  - Every resolver needs a corresponding `AWS::AppSync::Resolver` or `AWS::AppSync::FunctionConfiguration` resource
  - If resolver exists but isn't in appsync.yaml, AppSync won't use it and queries will fail
  - This has caused multiple issues where resolvers were created but never deployed

#### AppSync JavaScript Runtime Restrictions

AppSync resolvers run in a restricted JavaScript environment. Follow these conventions strictly:

**✅ REQUIRED PATTERNS:**

- **Imports**: Must import `{ util, Context }` from `"@aws-appsync/utils"`
- **IDs**: Use `util.autoId()` - NOT `uuid` or other libraries
- **Timestamps**: Use `util.time.nowISO8601()` - NOT `new Date().toISOString()`
- **DynamoDB**: Use `util.dynamodb.toMapValues()` for converting objects
- **Errors**: Use `return util.error(message, type)` - MUST include `return` keyword
  - In request function: `return util.error("Invalid input", "ValidationException")`
  - In response function: `return util.error(ctx.error.message, ctx.error.type)`
  - `util.error()` throws an error - it doesn't return a value, but you still need `return` for TypeScript

**✅ ALLOWED JAVASCRIPT:**

- Template literals, arrow functions, spread operators
- Object/array manipulation (map, filter, reduce, etc.)
- for loops, for...of loops
- console.log() for logging
- Nullish coalescing (`??`) and optional chaining (`?.`)
- Standard ES6+ features

**❌ NOT ALLOWED:**

- `new Date()` - causes "code contains one or more errors" at deployment
- `uuid` package or other external npm packages
- Node.js built-in modules (fs, path, crypto, etc.)
- Most browser/Node APIs not in the util namespace

**Common Mistakes:**

- Using `new Date()` instead of `util.time.nowISO8601()` (causes deployment failure)
- Forgetting `return` before `util.error()` (causes compilation errors)
- Importing external packages that aren't available in AppSync runtime

### DynamoDB Table Structure

- Single table design with PK/SK pattern
- Example patterns:
  - Comments: `PK: STORY#<storyId>#NODE#<nodeId>`, `SK: COMMENT#<timestamp>`
  - Stories: `PK: STORY#<storyId>`, `SK: METADATA`

### Authentication

- AWS Cognito for user auth
- Dual auth modes: `@aws_cognito_user_pools` and `@aws_iam`
- Guest access supported via IAM for read operations

### GraphQL Schema Merging for AppSync

- **CRITICAL**: LocalStack's AppSync does NOT support forward type references
- All types MUST be defined before they are used in the schema
- Schema files are processed alphabetically by the merge script
- **Solution**: Put shared enums and base types in `00-schema.graphql` so they're defined first
- Example: `AgeRating` enum must be in `00-schema.graphql`, not `Story.graphql`, because `ChapterNode.graphql` uses it
- After modifying schema files, ALWAYS run: `npx ts-node packages/the-story-hub/backend/scripts/merge-schema-for-appsync.ts`
- The merged schema is uploaded to S3 and used by AppSync during deployment

#### Schema Deployment Issue

- **PROBLEM**: CloudFormation's `AWS::AppSync::GraphQLSchema` with `DefinitionS3Location` does NOT detect S3 file content changes
- CloudFormation only updates the schema when the S3 location URL changes, not when the file content changes
- **SOLUTION**: Use content-based versioning for schema S3 key (e.g., `schema-{hash}.graphql`)
  - Calculate hash of schema file content
  - Upload to S3 with versioned key: `schema-{hash}.graphql`
  - Update CloudFormation parameter/template to reference the new versioned key
  - This forces CloudFormation to see a "change" and reload the schema in AppSync
- **NEVER** use quick workarounds like manual AWS CLI calls - always implement properly with versioned keys

#### Lambda Deployment Issue

- **PROBLEM**: CloudFormation's `AWS::Lambda::Function` with S3 code source does NOT update Lambda code when only S3 file content changes
- CloudFormation only updates Lambda code when the S3 location (Bucket/Key) changes, NOT when file content at that location changes
- Changing environment variables or Description does NOT trigger code updates - only metadata is updated
- **SOLUTION**: After uploading Lambda zip to S3, directly call `aws lambda update-function-code` to force the update
  - Implemented in `lambda-compiler.ts` - automatically force updates after S3 upload
  - Handles ResourceNotFoundException gracefully (Lambda doesn't exist yet on first deploy)
  - This ensures Lambda code is ALWAYS up to date regardless of CloudFormation's change detection

---

## Common Commands

### Development

- `yarn dev:tsh` - Start The Story Hub frontend dev server (from root)
- `yarn build:tsh` - Build The Story Hub frontend (from root)
- `yarn lint` - Run linter
- `yarn workspace tshfrontend update-env` - Manually update `.env.local` from AWS (auto-generated during deployment)

### Deployment

**Quick Deploy (Non-interactive)**:

- `yarn deploy:tsh:dev` - Deploy The Story Hub to dev with default settings (replace strategy)
  - Default settings: stage=dev, strategy=replace, admin-email=vesnathan@gmail.com, skip-waf=false, disable-rollback=true, build-frontend=false, skip-user-creation=false
  - Override with flags: `yarn deploy:tsh:dev --admin-email=your@email.com --stage=prod --skip-waf=true`
  - Use `yarn deploy:tsh:dev --help` to see all options
  - **Dependencies**: Requires Shared stack and WAF stack to be deployed first (unless --skip-waf=true)
  - **Force Replace**: When using replace strategy, S3 buckets are automatically emptied and deleted before stack deletion

- `yarn deploy:tsh:dev:update` - Update The Story Hub dev stack (update strategy, skips user creation)
  - Default settings: stage=dev, strategy=update, skip-user-creation=true, skip-waf=false, disable-rollback=true, build-frontend=false
  - Use this for iterative deployments when you don't want to recreate the admin user or reset the database
  - Can add flags: `yarn deploy:tsh:dev:update --build-frontend`

**Interactive Deploy**:

- `yarn deploy` - Interactive deployment wizard (asks for all options)

### Database

- Seed script: `packages/the-story-hub/backend/scripts/seed-db.ts`

---

## Notes for Future Sessions

- Always read this file at the start of a new session for context
- Update this file with significant changes, decisions, and pending work
- User prefers concise, technical communication
- Focus on facts and problem-solving over validation

### Pending Issues

- **OP Approved Badge - Multiple Branches**: Multiple branches under the same parent node are showing "OP Approved" badges
  - Business rule: **Only ONE branch can be OP Approved per parent node**
  - Need to add enforcement in the admin settings/mutation to ensure only one branch can be approved at a time
  - When approving a branch, any previously approved sibling branches should be automatically un-approved

### Recent Issues Resolved

- **Admin Mutations Using Wrong Auth Mode (2025-11-05)**:
  - Issue: `updateSiteSettings` mutation returning "Unauthorized" even after fixing schema and resolver
  - Root cause: Frontend was not specifying `authMode`, so Amplify defaulted to IAM authentication (Cognito Identity Pool)
  - IAM identity objects don't have `groups` property - only Cognito User Pool identities have groups
  - AppSync logs showed: `"identity.groups:" null` and identity was IAM role instead of User Pool user
  - Solution: Added `authMode: "userPool"` to the GraphQL mutation call in frontend API
  - Files affected: [settings.ts:41](packages/the-story-hub/frontend/src/lib/api/settings.ts#L41)
  - **Important**: Admin mutations MUST explicitly specify `authMode: "userPool"` to access Cognito groups
  - Lesson: Always specify authMode for protected operations - don't rely on Amplify defaults

- **Invalid cognito_groups Parameter in GraphQL Schema (2025-11-05)**:
  - Issue: `updateSiteSettings` mutation returning "Unauthorized: Only site administrators can update settings" (403) even for admin users
  - Root cause: Schema file had `@aws_cognito_user_pools(cognito_groups: ["SiteAdmin"])` directive parameter, which is NOT supported in GraphQL SDL
  - This parameter was previously removed in commit 9840e27 but was accidentally re-added
  - Solution: Removed `cognito_groups: ["SiteAdmin"]` parameter from `@aws_cognito_user_pools` directive in SiteSettings.graphql
  - The authorization check remains in the resolver code (`identity.groups.includes("SiteAdmin")`)
  - Files affected: [SiteSettings.graphql:33](packages/the-story-hub/backend/schema/SiteSettings.graphql#L33)
  - **Important**: The `cognito_groups` parameter is ONLY valid in AppSync resolver CloudFormation configuration, NOT in GraphQL SDL schema
  - Lesson: AppSync GraphQL directives in SDL don't support group parameters - group checking must be done in resolver code

- **Admin Settings Menu Not Showing After Login (2025-11-05)**:
  - Issue: "Admin Settings" menu item didn't appear immediately after login on homepage
  - Root cause: `useIsAdmin` hook only ran once on mount with empty dependency array, so it didn't re-check when user logged in
  - Solution: Added Amplify Hub listener to watch for auth events (`signedIn`, `signedOut`, `tokenRefresh`) and trigger re-check
  - Files affected: `useIsAdmin.ts` (added Hub listener and authChangeCounter state), `Navbar.tsx` (added isAdminLoading check)
  - Lesson: React hooks that depend on external state (like auth) need to listen for state changes, not just run once

- **Lambda Authorization for API Gateway V2 HTTP API (2025-11-05)**:
  - Issue: `updatePatreonSecrets` Lambda returning "Admin access required" (403) for admin users
  - Root causes (multiple issues):
    1. Lambda was using `APIGatewayProxyHandler` (REST API format) instead of `APIGatewayProxyHandlerV2` (HTTP API format)
    2. Lambda was checking `event.requestContext.authorizer.claims` instead of `event.requestContext.authorizer.jwt.claims`
    3. Lambda was reading `event.httpMethod` and `event.path` instead of `event.requestContext.http.method` and `event.rawPath`
    4. Frontend was sending ID token instead of access token (cognito:groups is only in access token)
  - Solution:
    - Changed Lambda to use `APIGatewayProxyHandlerV2` type
    - Updated to read from `event.requestContext.authorizer.jwt.claims`
    - Updated to read method/path from correct V2 format
    - Changed frontend to send access token instead of ID token
  - Files affected: `packages/the-story-hub/backend/lambda/updatePatreonSecrets.ts`, `packages/the-story-hub/frontend/src/lib/api/patreonSecrets.ts`
  - **Important differences between API Gateway formats**:
    - REST API: `event.httpMethod`, `event.path`, `event.requestContext.authorizer.claims`
    - HTTP API V2: `event.requestContext.http.method`, `event.rawPath`, `event.requestContext.authorizer.jwt.claims`
  - **Token types**: cognito:groups claim is in access token, not ID token - always use access token for authorization
  - Lesson: API Gateway V2 HTTP API has completely different event structure than REST API - check CloudFormation template to see which type is configured

- **Protected Routes Not Redirecting on Logout (2025-11-05)**:
  - Issue: Settings and admin settings pages showed error messages instead of redirecting when user logged out
  - Root cause: Routes were checking auth during render instead of using useEffect for navigation
  - Solution: Updated `RequireAdmin` to use useEffect for redirect, updated settings page to use `RequireAuth` wrapper component
  - Files affected: `RequireAdmin.tsx`, `settings/page.tsx`
  - Pattern: Always use wrapper components with useEffect for protected route redirects, never redirect during render

- **AgeRating Enum Values (2025-11-05)**:
  - Issue: Deployment failed with "Property 'MATURE' does not exist on type 'typeof AgeRating'"
  - Root cause: AgeRating enum uses film rating values (G, PG, PG_13, M, ADULT_18_PLUS), but code was using generic values (GENERAL, TEEN, MATURE, EXPLICIT)
  - Solution: Updated all code to use correct enum values
  - **Correct values**: `AgeRating.G`, `AgeRating.PG`, `AgeRating.PG_13`, `AgeRating.M`, `AgeRating.ADULT_18_PLUS`
  - **NEVER use**: GENERAL, TEEN, MATURE, EXPLICIT (these don't exist!)
  - Files affected: Query.getUserProfile.ts, settings page
  - Lesson: Always check the actual enum definition in `00-schema.graphql` before using enum values

- **GraphQL Schema Parse Failure (2025-11-04)**:
  - Issue: "Failed to parse schema document" error during AppSync deployment
  - Root cause: LocalStack AppSync doesn't support forward type references - `AgeRating` enum was defined in `Story.graphql` but used earlier in `ChapterNode.graphql` (alphabetical ordering)
  - Solution: Moved `AgeRating` enum to `00-schema.graphql` so it's defined before use
  - Lesson: Always define shared types in `00-schema.graphql` or files that sort alphabetically before their usage
