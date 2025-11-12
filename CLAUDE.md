# Card Counting Trainer - Current Status

## Important Notes
- **DO NOT start dev servers** - They are already running in the background
- **NEVER BUILD** - DO NOT run `npm run build`, `yarn build`, or any build commands. Builds take too long and background builds are already running.
- **Type checking**: ALWAYS use `yarn workspace cctfrontend tsc --noEmit` to check for TypeScript errors. This is fast and sufficient.
- **Testing changes**: The dev server is already running, just check with tsc and test in browser

## Fixed Issues

### 1. Syntax Error in Dealer Turn useEffect (FIXED)
- **Location**: [page.tsx:1865](packages/card-counting-trainer/frontend/src/app/page.tsx#L1865)
- **Problem**: Extra closing brace after `registerTimeout` callback
- **Fix**: Removed the extra `}` at line 1865
- **Status**: ✅ Fixed - build now compiles successfully

### 2. TypeScript Error in useBlackjackGame.ts (FIXED)
- **Location**: [useBlackjackGame.ts:123](packages/card-counting-trainer/frontend/src/hooks/useBlackjackGame.ts#L123)
- **Error**: `Argument of type 'boolean' is not assignable to parameter of type 'GameSettings'`
- **Problem**: `getBasicStrategyAction` expects `GameSettings` as third parameter
- **Fix**:
  - Added import for `DEFAULT_GAME_SETTINGS`
  - Updated function call: `getBasicStrategyAction(hand.cards, dealerUpCard, DEFAULT_GAME_SETTINGS, canSplitHand, canDoubleHand)`
- **Status**: ✅ Fixed

### 3. Card Animation Position Mismatch (FIXED)
- **Problem**: Flying card animations go to different positions than where the actual cards render
- **Root Cause**: Flying cards used simple offsets while rendered cards use grid layout (3 cards per row)
- **Fix**: Updated `getCardPosition()` function to calculate exact grid positions:
  - **AI/Player cards**: Cards in 230px centered container, positioned at `col * 74px`, `row * 102px`
  - **Dealer cards**: Cards in 370px centered container at top, positioned at `idx * 74px`
  - Animation now targets exact final positions accounting for container centering
- **Locations Fixed**:
  - [page.tsx:329-340](packages/card-counting-trainer/frontend/src/app/page.tsx#L329-L340) - Dealer positions
  - [page.tsx:345-360](packages/card-counting-trainer/frontend/src/app/page.tsx#L345-L360) - Player positions
  - [page.tsx:363-377](packages/card-counting-trainer/frontend/src/app/page.tsx#L363-L377) - AI player positions
- **Status**: ✅ Fixed - cards now animate to their exact final positions

## Recent Changes

### Training Modes Removed (Latest)
- **What**: Removed all training mode functionality (Practice, Test, Timed Challenge)
- **Why**: User requested to keep only the default mode (always showing running count)
- **Changed files**:
  - [gameSettings.ts](packages/card-counting-trainer/frontend/src/types/gameSettings.ts) - Removed TrainingMode enum and related fields
  - [StatsBar.tsx](packages/card-counting-trainer/frontend/src/components/StatsBar.tsx) - Simplified to always show COUNT, removed timeRemaining
  - [BlackjackGameUI.tsx](packages/card-counting-trainer/frontend/src/components/BlackjackGameUI.tsx) - Removed timeRemaining prop
  - [GameSettingsModal.tsx](packages/card-counting-trainer/frontend/src/components/GameSettingsModal.tsx) - Removed training mode selector UI
  - [page.tsx](packages/card-counting-trainer/frontend/src/app/page.tsx) - Removed useTimedChallenge hook and timeRemaining state
- **Note**: useTimedChallenge.ts still exists but is unused

### Bet Minimum Display Added
- **What**: Added "$25 MINIMUM" text to the table rules display
- **Location**: [TableRules.tsx](packages/card-counting-trainer/frontend/src/components/TableRules.tsx)
- **Implementation**: Added third curved arc below the existing table rules text

### AI Player Reactions to Dealer Blackjack (Latest)
- **What**: AI players now react when dealer peeks and reveals blackjack
- **Problem**: When dealer peeked for blackjack and won, AI players remained silent
- **Fix**: Added `showEndOfHandReactions()` call when dealer reveals blackjack after peeking
- **Changes**:
  - [useGameActions.ts](packages/card-counting-trainer/frontend/src/hooks/useGameActions.ts#L372-L374) - Call showEndOfHandReactions() with 500ms delay
  - [page.tsx](packages/card-counting-trainer/frontend/src/app/page.tsx#L199) - Pass showEndOfHandReactions to useGameActions
- **Result**: AI players now show appropriate loss reactions when dealer gets blackjack

## Recent Commits

- `ae162a6` - Add processing guards, fix table positions, update card sizes
- `4710ca1` - Fix: use fixed positions for cards to prevent movement
- `ac19b0f` - Fix: prevent duplicate cards by avoiding mutation in state updates
- `e3337c0` - Debug: add comprehensive logging to card dealing
- `9cb4d61` - Fix: correct card dealing order to right-to-left
- `60b2a68` - Fix: resolve card dealing bug - each player now gets unique cards

## Constants

Animation and layout constants are now centralized in:
- [animations.ts](packages/card-counting-trainer/frontend/src/constants/animations.ts)
  - `CARD_ANIMATION_DURATION = 1500ms` (slowed for testing)
  - `CARD_WIDTH = 70px`
  - `CARD_HEIGHT = 98px`
  - `CARD_SPACING = 15px`
  - `TABLE_POSITIONS` - 8 seat positions as `[left%, top%]` arrays

## Implementation Details

### Card Position Calculations
The `getCardPosition()` function now correctly calculates positions for flying card animations:

**AI and Player Cards:**
- Cards render in a 230px wide container, centered on the player position
- Grid layout: 3 cards per row
- Column positions: `col * 74px` (0px, 74px, 148px)
- Row positions: `row * 102px` (0px, 102px, ...)
- Container offset: `-115px` to account for centering (230px / 2)
- Vertical: `204px - row * 102px` below player position (150px avatar + 54px gap - row offset)

**Dealer Cards:**
- Cards render in a 370px wide container, centered at top of screen
- Linear layout (no rows)
- Positions: `idx * 74px` (0px, 74px, 148px, ...)
- Container offset: `-185px` to account for centering (370px / 2)
- Vertical: `3% + 162px + 4px` (dealer section top + avatar height + gap)

---

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

- Deployment commands: `yarn deploy:tsh:dev` (replace strategy), `yarn deploy:tsh:dev:update` (update strategy)
- **Database seeding runs AUTOMATICALLY during deployment** - do NOT tell user to reseed after deploy
- When asked to deploy, you can run deployments directly using the Bash tool
- Use update strategy (`yarn deploy:tsh:dev:update`) for iterative changes to avoid recreating resources

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

- **CRITICAL**: AppSync does NOT support forward type references
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

### Before Production Deployment

**Critical Testing Required**:

- **Full Patreon Integration Test**: The Patreon integration has been implemented but NOT fully tested end-to-end
  - Test OAuth flow: User connects Patreon account
  - Test webhook: Verify pledge/unpledge events update user status
  - Test daily sync: Verify scheduled sync updates all Patreon supporters
  - Test secret management: Verify admin can update Patreon API credentials via admin settings
  - Test tier detection: Verify correct tier is assigned (BRONZE, SILVER, GOLD, PLATINUM)
  - Test OG badge: Verify site setting for granting OG badge to Patreon supporters works correctly

**Unit Testing**:

- **CRITICAL**: The entire site lacks unit tests
  - Need to add Jest/Vitest testing framework
  - Need to write unit tests for all resolvers
  - Need to write unit tests for all Lambda functions
  - Need to write unit tests for frontend components
  - Need to write integration tests for API endpoints
  - This should be completed BEFORE production deployment

**Database Backups**:

- **CRITICAL**: Set up automated DynamoDB backups before production
  - Configure point-in-time recovery (PITR) for DynamoDB table
  - Set up automated daily backups with retention policy
  - Test backup restoration process
  - Document backup and recovery procedures
  - Consider cross-region backup replication for disaster recovery

### Pending Issues

- **OP Approved Badge - Multiple Branches**: Multiple branches under the same parent node are showing "OP Approved" badges
  - Business rule: **Only ONE branch can be OP Approved per parent node**
  - Need to add enforcement in the admin settings/mutation to ensure only one branch can be approved at a time
  - When approving a branch, any previously approved sibling branches should be automatically un-approved

- **Facebook OAuth Secret Name Change (2025-11-07)**:
  - **Issue**: Original secret name `nlmonorepo-thestoryhub-facebook-oauth-secrets-dev` already existed from Lambda and couldn't be deleted immediately (7-day AWS retention)
  - **Solution**: Changed secret name to `nlmonorepo-thestoryhub-facebook-login-secrets-dev` in CloudFormation to match Google OAuth pattern
  - **Current State**: Facebook OAuth now follows same CloudFormation-managed pattern as Google OAuth, just with different secret name
  - **Files Modified**: [cognito.yaml:36-47](packages/deploy/templates/the-story-hub/resources/Cognito/cognito.yaml#L36-L47) - Uses new secret name `facebook-login-secrets`
  - **Note**: Old secret `nlmonorepo-thestoryhub-facebook-oauth-secrets-dev` can be manually deleted from AWS Console after ~2025-11-14 (no action required, it's scheduled for deletion)

### Recent Work

- **Cognito Post-Confirmation Lambda Restructuring (2025-11-05)**:
  - **Goal**: Fix user signup bug where new users get Cognito accounts but no DynamoDB profile, causing getUserProfile to fail
  - **Problem discovered**: User `vesnathan+tsh@gmail.com` could sign up and login but couldn't access settings page due to missing DynamoDB record
  - **Root cause**: No post-confirmation Lambda trigger configured to create DynamoDB user profiles after Cognito signup
  - **Immediate fix**: Manually created DynamoDB record for affected user
  - **Permanent fix**: Implementing Cognito post-confirmation Lambda trigger
  - **Architecture challenge**: Hit circular dependency when trying to add Lambda
    - CognitoStack needs LambdaStack (for Lambda ARN)
    - LambdaStack needs CognitoStack (for UserPoolId)
    - CloudFormation cannot resolve this circular dependency
  - **Solution**: Moved post-confirmation Lambda INTO CognitoStack itself
    - Lambda function now lives in Cognito template, not Lambda template
    - CognitoStack is self-contained and doesn't depend on LambdaStack
    - LambdaStack can still depend on CognitoStack (no circular dependency)
  - **Files modified**:
    - Created: [cognitoPostConfirmation.ts](packages/the-story-hub/backend/lambda/cognitoPostConfirmation.ts) - Lambda function code
    - Modified: [cognito.yaml](packages/deploy/templates/the-story-hub/resources/Cognito/cognito.yaml) - Added Lambda resources (function, role, permission, log group)
    - Modified: [lambda.yaml](packages/deploy/templates/the-story-hub/resources/Lambda/lambda.yaml) - Removed all CognitoPostConfirmation resources
    - Modified: [cfn-template.yaml](packages/deploy/templates/the-story-hub/cfn-template.yaml) - Updated CognitoStack parameters and dependencies
  - **Lambda details**:
    - Creates DynamoDB user profile with proper structure based on seed-data.ts pattern
    - Runs after user confirms email or admin creates user
    - Uses Cognito user attributes (sub, email, given_name, family_name)
    - Sets default values for userScreenName (from email), patreonSupporter (false), ogSupporter (false)
    - Handles duplicate users gracefully (ConditionalCheckFailedException)
  - **Status**: CloudFormation templates validated successfully, ready to deploy
  - **Next step**: User needs to run `yarn deploy:tsh:dev` to deploy the fix
  - **Note**: Lambda code path in S3 is `lambdas/${Stage}/cognitoPostConfirmation.zip` (NOT `functions/`)

- **CloudFront Frontend Setup (2025-11-05)**:
  - Issue: CloudFront distribution returning "Access Denied" - no frontend bucket or files deployed
  - Root cause: CloudFront was pointing to userfiles bucket instead of dedicated frontend bucket
  - Solution implemented:
    - Created new `FrontendBucket` resource in S3 stack (`nlmonorepo-${AppName}-frontend-${Stage}`)
    - Added outputs: FrontendBucketName, FrontendBucketArn, FrontendBucketRegionalDomainName
    - Updated CloudFront stack to use FrontendBucket instead of TSHBucket (userfiles)
    - Added custom error responses to CloudFront for Next.js SPA routing (403/404 → /index.html)
    - Built frontend successfully (static export in `out` directory)
  - Files affected:
    - [s3.yaml:18-36](packages/deploy/templates/the-story-hub/resources/S3/s3.yaml#L18-L36) - Added FrontendBucket
    - [s3.yaml:62-72](packages/deploy/templates/the-story-hub/resources/S3/s3.yaml#L62-L72) - Added FrontendBucket outputs
    - [cfn-template.yaml:89-91](packages/deploy/templates/the-story-hub/cfn-template.yaml#L89-L91) - CloudFront now uses FrontendBucket
    - [cfn-template.yaml:166](packages/deploy/templates/the-story-hub/cfn-template.yaml#L166) - WebsiteBucket output uses FrontendBucket
    - [cloudfront.yaml:86-94](packages/deploy/templates/the-story-hub/resources/CloudFront/cloudfront.yaml#L86-L94) - Added CustomErrorResponses
  - Next step: User needs to run `yarn deploy:tsh:dev:update` to deploy updated stack
  - Note: TSHBucket remains as userfiles bucket, FrontendBucket is separate for static website hosting

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
  - Root cause: AppSync doesn't support forward type references - `AgeRating` enum was defined in `Story.graphql` but used earlier in `ChapterNode.graphql` (alphabetical ordering)
  - Solution: Moved `AgeRating` enum to `00-schema.graphql` so it's defined before use
  - Lesson: Always define shared types in `00-schema.graphql` or files that sort alphabetically before their usage

### CloudFront & Frontend Deployment

- **CloudFront Story Routes Showing Homepage (2025-11-05)**:
  - Issue: CloudFront route `/story/{storyId}/` was displaying homepage instead of story content
  - Root cause: Next.js app uses static export (`output: "export"`) with a single placeholder page at `/story/placeholder/index.html`. When CloudFront receives requests for non-existent story IDs, S3 returns 404, and CloudFront's `CustomErrorResponses` redirects to `/index.html` (homepage)
  - Solution: Added CloudFront Function to rewrite story URLs to the placeholder page for client-side routing
  - Files affected: [cloudfront.yaml:39-69](packages/deploy/templates/the-story-hub/resources/CloudFront/cloudfront.yaml#L39-L69) (SPARoutingFunction)
  - **How it works**:
    1. CloudFront Function intercepts all viewer requests
    2. Matches `/story/{storyId}/` or `/story/{storyId}/{nodeId}/` patterns
    3. Rewrites URI to `/story/placeholder/index.html`
    4. S3 serves the placeholder HTML with "Loading story..." state
    5. JavaScript loads and uses `useParams()` to get storyId/nodeId from URL
    6. Client fetches actual story data from GraphQL API and renders
  - **Function configuration**:
    - Runtime: `cloudfront-js-2.0`
    - Event type: `viewer-request`
    - Name: `{AppName}-{Stage}-spa-routing`
    - AutoPublish: true
  - **Important**: This is the correct pattern for Next.js static export SPAs - the placeholder page is NOT a real story, it's the shell that loads the real story client-side
  - Lesson: CloudFront Functions are ideal for URL rewriting in SPAs - they run at edge locations with minimal latency

- **Story Page Reading "placeholder" as StoryId (2025-11-05)**:
  - Issue: After CloudFront Function was added, story pages were querying for storyId "placeholder" instead of the actual story ID from the URL
  - Root cause: `useParams()` reads route parameters from the actual file path served by Next.js. When CloudFront Function rewrites `/story/{storyId}/` to `/story/placeholder/index.html`, Next.js reads "placeholder" as the storyId
  - Solution: Changed StoryPageClient to use `usePathname()` instead of `useParams()` to read the actual browser URL, then parse the storyId from pathname
  - Files affected: [StoryPageClient.tsx:5,556-563](packages/the-story-hub/frontend/src/app/story/[storyId]/[[...nodeId]]/StoryPageClient.tsx#L5,L556-L563)
  - **Code change**:
    ```typescript
    // OLD: const storyId = (params?.storyId as string) || "";
    // NEW:
    const pathname = usePathname();
    const storyId = pathname?.split("/")[2] || (params?.storyId as string) || "";
    ```
  - **Important**: For SPAs with CloudFront URL rewriting, always use `usePathname()` or `window.location.pathname` to read the actual browser URL, not `useParams()` which reads the physical file path
  - Lesson: CloudFront Functions rewrite the request URI before it reaches S3, but the browser URL remains unchanged - use this to your advantage in client-side routing

- **CloudFront Complete Failure After Adding Security Features (2025-11-05)**:
  - Issue: After implementing OAC, KMS encryption, WAF, and caching policies, CloudFront returned Access Denied for all requests
  - Investigation: Attempted to fix by removing CloudFront Function, invalidating cache, manually attaching OAC - nothing worked
  - Solution: Stripped everything down to minimal configuration to establish baseline
  - **Working minimal configuration** (tested 2025-11-05):
    - CloudFront URL: `http://d31ljsocam0k5r.cloudfront.net/`
    - Distribution ID: E1KK27C2D8DADA
    - Public S3 bucket with public bucket policy (no OAC)
    - No KMS encryption on bucket
    - No WAF
    - Basic ForwardedValues caching (no caching policies)
    - CloudFront Function for SPA routing (working correctly)
  - **What's working**: Homepage, all static pages, and story routes with CloudFront Function
  - **Next steps**: Add features back incrementally to identify what causes Access Denied:
    1. First: Test OAC (Origin Access Control) for secure S3 access
    2. Then: Add KMS encryption to bucket
    3. Then: Add caching policies
    4. Then: Add WAF if needed
  - Files: `/tmp/minimal-cloudfront.yaml` contains working baseline template
  - Lesson: When CloudFront completely breaks, strip to absolute minimum (public bucket + basic distribution) to establish baseline, then add features back one at a time
>>>>>>> origin/dev
