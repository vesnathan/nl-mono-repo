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
