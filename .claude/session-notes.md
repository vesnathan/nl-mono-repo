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

---

## 2025-11-02: Comment System Nested Replies Fix

### Problem
Backend wasn't returning nested replies even though frontend GraphQL query requested them. The `replies` field was returning `null` instead of an array of nested comments.

### Root Cause
The `listComments` resolver was only querying and returning top-level comments. There was no field resolver to populate the `replies` field on the `Comment` GraphQL type.

### Solution
Created an AppSync field resolver for `Comment.replies` that automatically fetches nested replies when the field is requested in a GraphQL query. AppSync will recursively call this resolver for each level of nesting.

### Files Changed
- **Created**: `packages/the-story-hub/backend/resolvers/comments/Fields/Comment.replies.ts`
  - Queries for direct children of each comment (where `parentCommentId` matches)
  - Returns up to 20 replies per comment
  - Skips querying if `stats.replyCount` is 0 for efficiency
  - Includes logging for debugging

- **Modified**: `packages/deploy/templates/the-story-hub/resources/AppSync/appsync.yaml`
  - Added `CommentRepliesResolver` configuration (lines 481-493)
  - Configured as UNIT resolver on `Comment` type, `replies` field

### How It Works
When frontend requests nested replies:
1. `listComments` resolver fetches top-level comments
2. AppSync sees `replies` field requested and calls `Comment.replies` field resolver for each comment
3. Field resolver recursively resolves nested replies up to 3 levels deep (as specified in frontend query)

### Current Status
- Backend deployed successfully - API returning nested replies correctly
- Fixed Zod validation schemas to accept API response format:
  - Changed `createdAt`/`updatedAt` from strict `.datetime()` to `.string()` (DynamoDB format differs from ISO 8601)
  - Added optional `__typename` fields to all schemas
  - Badge fields use `.nullable().optional().default(false)` pattern
- Comments should now display properly in frontend

### Frontend Implementation
- Frontend already has comprehensive logging in place to verify replies are received
- GraphQL query in `comments.ts` requests 3 levels of nesting
- `CommentSection.tsx` has state management for pagination and comment display
- `CommentThread.tsx` displays nested comments recursively

---

## Pending Tasks

### High Priority
1. **Verify nested replies work after deployment** - Check console logs to confirm replies are populated
2. **Implement "Load More Replies" button functionality** - Currently shows indicator but doesn't fetch more replies
3. **Implement branch creation functionality** - "Add Your Own Branch" buttons currently use placeholder `console.log`
4. **Implement ad integration for non-Patreon supporters**
   - Use Google AdSense or similar ad network
   - Show ads between chapters/story nodes for users who are NOT Patreon supporters
   - Check `userPatreonSupporter` flag to determine ad display
   - Best practice: Place ads at natural break points (chapter ends) to minimize UX disruption
   - Consider lazy loading and responsive ad units

### Medium Priority
5. **Enforce OP Approved uniqueness** - Backend should validate only one branch per branch point can have `matchesVision: true`
6. **Investigate branch display issue** - User reported a path showing it has branches but none display when loaded

---

## Recent Features Completed

### UI/UX Improvements
- Support page: Centered "Our first Patrons Receive" section, removed border
- Comment UI: Made vote buttons, reply button, and dropdown text white for visibility
- Reply button: Now only visible to logged-in users
- Single branch auto-display: Shows branch directly without accordion if only one exists
- Login modal: Replaced `/login` route with modal popup from navbar

### Backend/Data
- Unique seed comments: Expanded from 4 generic to contextual comments based on story content
- Added Transcendence story seed: Complete sci-fi novel with 3 branches
- Comment pagination: Last 20 comments with "Load Previous Comments" button

### Features
- Auth-gated branch buttons: Added "+ Add Your Own Branch" buttons with `AuthRequiredButton`
- OP Approved badge: Changed from "Matches OP Vision" to "OP Approved", sorts to top
- Comment counts on homepage: Added `totalComments` to GraphQL queries for story cards

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

### DynamoDB Table Structure
- Single table design with PK/SK pattern
- Example patterns:
  - Comments: `PK: STORY#<storyId>#NODE#<nodeId>`, `SK: COMMENT#<timestamp>`
  - Stories: `PK: STORY#<storyId>`, `SK: METADATA`

### Authentication
- AWS Cognito for user auth
- Dual auth modes: `@aws_cognito_user_pools` and `@aws_iam`
- Guest access supported via IAM for read operations

---

## Common Commands

### Development
- `yarn dev` - Start frontend dev server
- `yarn build` - Build frontend
- `yarn lint` - Run linter

### Deployment
- `yarn deploy:tsh:dev` - Deploy The Story Hub to dev (ask user to run)
- `yarn deploy:tsh:prod` - Deploy to production (ask user to run)

### Database
- Seed script: `packages/the-story-hub/backend/scripts/seed-db.ts`

---

## Notes for Future Sessions
- Always read this file at the start of a new session for context
- Update this file with significant changes, decisions, and pending work
- User prefers concise, technical communication
- Focus on facts and problem-solving over validation
