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

### Seed Data Pattern

- **Single source of truth**: All seed data lives in `packages/the-story-hub/backend/data/seed-data.ts`
- **Hardcoded UUIDs**: All IDs are predefined constants, never generated
- **Frontend imports from backend**: Frontend imports seed data via `packages/the-story-hub/frontend/src/lib/seed-data.ts` (which re-exports from backend)
- **Seed script imports all data**: `packages/the-story-hub/backend/scripts/seed-db.ts` must import and use data from `seed-data.ts`
- **Why this matters**: Local development data must match live database exactly so URLs/IDs work consistently
- **NEVER generate UUIDs in seed script**: Always use the hardcoded IDs from `seed-data.ts`

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

---

## Pending Work / Action Items

### Authentication Features

**Social Login Setup (feature/social-login branch)**
- Status: Code complete, committed locally, needs push and OAuth configuration
- Files modified:
  - `packages/the-story-hub/frontend/src/components/auth/LoginModal.tsx` - Added Google, Facebook, Apple login buttons
  - Uses AWS Amplify `signInWithRedirect` for federated authentication
- Remaining tasks:
  1. User needs to push branch: `git push -u origin feature/social-login`
  2. Configure OAuth providers in AWS Cognito User Pool (`ap-southeast-2_jQhmdcfFd`):
     - Google: Get Client ID/Secret from Google Cloud Console
     - Facebook: Get App ID/Secret from Facebook Developers
     - Apple: Get Service ID/Key from Apple Developer
     - Add redirect URI for each: `https://nlmonorepo-tsh-userpool-dev.auth.ap-southeast-2.amazoncognito.com/oauth2/idpresponse`
  3. Configure App Client settings in Cognito for OAuth flow
  4. Test each provider after configuration
- AWS Console link: `https://ap-southeast-2.console.aws.amazon.com/cognito/v2/idp/user-pools/ap-southeast-2_jQhmdcfFd/app-integration`

**Auth Context Performance Optimization (feature/login-modal branch)**
- Completed: Optimized AuthContext with useMemo to prevent unnecessary re-renders
- Completed: Wrapped CommentThread with React.memo
- Merged to main via PR #83

### Branch Protection Policy

**Dev → Main Workflow Enforcement**
- Status: Files created but not committed
- Files ready to commit:
  - `.github/workflows/enforce_branch_policy.yml` - GitHub Action to enforce only dev/develop can merge to main
  - `.github/CODEOWNERS` - Require approval from @vesnathan
  - `.github/BRANCH_POLICY.md` - Documentation
- Remaining tasks:
  1. Create `dev` branch from `main`: `git checkout main && git checkout -b dev && git push -u origin dev`
  2. Commit branch policy files to `main`
  3. Configure GitHub branch protection rules at: `https://github.com/vesnathan/nl-mono-repo/settings/branches`
     - Add rule for `main` branch
     - Require PR reviews (1+ approval)
     - Require status check: `check-source-branch`
     - Require branches up to date
     - Do not allow bypassing
  4. Set `dev` as default branch for feature development

---

## Recent Changes (Current Session)

### Social Login Implementation
- Added social authentication to LoginModal with Google, Facebook, and Apple providers
- UI includes brand logos, "Or continue with" divider, consistent dark theme styling
- All social buttons disabled during email/password login for better UX

### Performance Optimization
- Refactored AuthContext to use individual state values instead of single object
- Added useMemo to prevent context value recreation on every render
- Wrapped CommentThread component with React.memo to prevent unnecessary re-renders
- Result: Only auth-dependent components re-render on login/logout, not entire component tree

### Branch Strategy Setup
- Created GitHub Action workflow to enforce branch policy
- Created CODEOWNERS file for required approvals
- Documented branch strategy in BRANCH_POLICY.md
- Workflow will automatically fail PRs to main that don't come from dev/develop
