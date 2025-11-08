# AI Agent Build Prompts for Story Branching Platform

## Important: Infrastructure Overview

This monorepo uses:

- **AppSync GraphQL API** (not REST/API Gateway) for all backend operations
- **AppSync Pipeline Resolvers** with TypeScript (not traditional Lambda handlers)
- **WAF Stack** (required dependency, deployed to us-east-1)
- **Shared Stack** (required dependency, provides VPC, KMS, etc.)
- **Deployment order**: WAF → Shared → Your App

Backend resolvers go in: `the-story-hub/backend/resolvers/`
Following the pattern: `resolvers/{domain}/{QueryOrMutation}/{Type}.{operationName}.ts`

## Phase 1: Foundation & Data Models

### Prompt 1: Project Setup & Shared Types

I'm building a collaborative story branching platform (like GitHub for stories).

**Tech stack:**

- Next.js 15 (App Router)
- React 19
- AWS AppSync (GraphQL API with Cognito auth)
- AppSync Pipeline Resolvers (TypeScript, not traditional Lambda handlers)
- Lambda Functions (only for S3 triggers and background jobs)
- DynamoDB (single-table design with PK/SK)
- S3 + CloudFront
- Cognito for auth
- TypeScript
- Zod for frontend form validation
- AWS Amplify (GraphQL client and auth)
- NextUI for components
- Tailwind CSS

**IMPORTANT ARCHITECTURE NOTES:**

- This monorepo uses AppSync GraphQL API, not REST API Gateway
- Backend logic is in AppSync Pipeline Resolvers (TypeScript request/response functions)
- Lambda functions are ONLY used for:
  - S3 event triggers (image processing)
  - Cognito triggers (user creation, welcome emails)
  - Background jobs
- GraphQL schema drives all types - not manual TypeScript definitions
- Zod is used ONLY in frontend for form validation

Create a monorepo structure with:

1. **the-story-hub/frontend** - Next.js application

   - src/types/gqlTypes.ts (auto-generated from GraphQL schema)
   - src/types/\*Schemas.ts (Zod validation schemas for forms)
   - scripts/buildGql.ts (GraphQL code generation script)

2. **the-story-hub/backend** - AppSync resolvers, Lambda functions, GraphQL schema

   - backend/schema/ - GraphQL schema files (\*.graphql)
   - backend/resolvers/ - AppSync Pipeline Resolvers (TypeScript)
   - backend/lambda/ - Lambda functions (S3 triggers, etc.)
   - backend/constants/ - Shared constants (not Zod schemas)

3. **deploy/templates/the-story-hub** - CloudFormation templates

   - cfn-template.yaml (main stack)
   - resources/AppSync/appsync.yaml
   - resources/DynamoDb/dynamoDb.yaml
   - resources/Lambda/lambda.yaml
   - resources/S3/s3.yaml
   - resources/CloudFront/cloudfront.yaml
   - resources/Cognito/cognito.yaml

4. **deploy/packages/the-story-hub** - Deployment configuration
   - deploy.ts (deployment handler)

**NOTE:** Types will be auto-generated from GraphQL schema. In backend/constants/, create only:

1. **ContentRatings.ts** - Age rating constants and helpers (similar to ClientTypes.ts pattern in aws-example):

   ```typescript
   export const AGE_RATINGS = [
     { id: "G", displayName: "General", description: "Suitable for all ages" },
     { id: "T", displayName: "Teen (13+)", description: "Ages 13+" },
     { id: "M", displayName: "Mature (16+)", description: "Ages 16+" },
     {
       id: "ADULT_18_PLUS",
       displayName: "Adult (18+)",
       description: "Ages 18+",
     },
   ] as const;

   export type AgeRating = (typeof AGE_RATINGS)[number]["id"];
   export const isValidAgeRating = (value: string): value is AgeRating =>
     AGE_RATINGS.some((r) => r.id === value);
   ```

2. **ContentWarnings.ts** - Warning tag constants:

   ```typescript
   export const CONTENT_WARNINGS = [
     "Sexual Content",
     "Violence/Gore",
     "Death",
     "Self-Harm/Suicide",
     // ... etc
   ] as const;
   ```

3. **Genres.ts** - Story genre constants:
   ```typescript
   export const STORY_GENRES = [
     "Fantasy",
     "Sci-Fi",
     "Romance",
     "Horror",
     // ... etc
   ] as const;
   ```

**DO NOT create Zod schemas in backend** - those belong in frontend for form validation only.
**DO NOT manually define Story, User, etc. types** - these come from GraphQL schema code generation.

---

### Prompt 2: DynamoDB Table Design

````
Design a DynamoDB **single-table design** for the story branching platform.

Following aws-example pattern (see deploy/templates/aws-example/resources/DynamoDb/dynamoDb.yaml):
- ONE table for ALL entities (Stories, ChapterNodes, Users, Bookmarks, Notifications, Votes)
- PK (partition key) and SK (sort key) attributes
- GSI1 (Global Secondary Index) with GSI1PK and GSI1SK for alternate access patterns
- Use PAY_PER_REQUEST billing mode
- Encrypt with KMS (passed from Shared stack)

**Access Patterns:**

1. **Get Story by ID**
   - PK = `STORY#{storyId}`, SK = `METADATA`

2. **Get all Chapters for Story**
   - PK = `STORY#{storyId}`, SK begins_with `NODE#`
   - Query returns all chapter nodes for the story

3. **Get User Profile**
   - PK = `USER#{userId}`, SK = `PROFILE#{userId}`

4. **Get User's Stories (created)**
   - GSI1PK = `USER#{userId}`, GSI1SK begins_with `STORY#`

5. **Get User's Branches (contributed)**
   - GSI1PK = `USER#{userId}`, GSI1SK begins_with `BRANCH#`

6. **Get Bookmark**
   - PK = `USER#{userId}`, SK = `BOOKMARK#{storyId}`

7. **Get Notifications**
   - PK = `USER#{userId}`, SK begins_with `NOTIFICATION#`

8. **Get Child Branches**
   - PK = `NODE#{parentNodeId}`, SK begins_with `CHILD#`

9. **Browse/Discover Stories**
   - GSI1PK = `STORY_LIST`, GSI1SK = `{timestamp}` or `{rating}`

**Entity Patterns:**

```typescript
// Story
PK: "STORY#{storyId}"
SK: "METADATA"
GSI1PK: "STORY_LIST"
GSI1SK: "{createdAt}#{storyId}"
// + all story attributes

// ChapterNode
PK: "STORY#{storyId}"
SK: "NODE#{nodeId}"
GSI1PK: "USER#{authorId}"
GSI1SK: "BRANCH#{createdAt}#{nodeId}"
// + all chapter attributes

// User
PK: "USER#{userId}"
SK: "PROFILE#{userId}"
// + all user attributes

// Bookmark
PK: "USER#{userId}"
SK: "BOOKMARK#{storyId}"
// + bookmark attributes

// Vote
PK: "USER#{userId}"
SK: "VOTE#{nodeId}"
// + vote attributes

// Notification
PK: "USER#{userId}"
SK: "NOTIFICATION#{timestamp}#{notificationId}"
GSI1PK: "NOTIFICATION#{notificationId}"
GSI1SK: "USER#{userId}"
````

**CloudFormation Template Structure:**

Place in: deploy/templates/the-story-hub/resources/DynamoDb/dynamoDb.yaml

Follow this pattern (from aws-example):

```yaml
Resources:
  # IAM Role for AppSync to access DynamoDB
  AppSyncDynamoDBRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub nlmonorepo-${AppName}-appsync-dynamodb-${Stage}
      AssumeRolePolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Effect: Allow
            Principal:
              Service: appsync.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: AppSyncDynamoDBAccess
          PolicyDocument:
            Version: "2012-10-17"
            Statement:
              - Effect: Allow
                Action:
                  - dynamodb:GetItem
                  - dynamodb:PutItem
                  - dynamodb:UpdateItem
                  - dynamodb:DeleteItem
                  - dynamodb:Query
                  - dynamodb:Scan
                Resource:
                  - !GetAtt TheStoryHubDataTable.Arn
                  - !Sub "${TheStoryHubDataTable.Arn}/*"
              - Effect: Allow
                Action:
                  - kms:Decrypt
                  - kms:GenerateDataKey
                Resource: !Ref KMSKeyArn

  # Single table for all entities
  TheStoryHubDataTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub "nlmonorepo-${AppName}-datatable-${Stage}"
      AttributeDefinitions:
        - AttributeName: "PK"
          AttributeType: "S"
        - AttributeName: "SK"
          AttributeType: "S"
        - AttributeName: "GSI1PK"
          AttributeType: "S"
        - AttributeName: "GSI1SK"
          AttributeType: "S"
      BillingMode: PAY_PER_REQUEST
      KeySchema:
        - AttributeName: "PK"
          KeyType: "HASH"
        - AttributeName: "SK"
          KeyType: "RANGE"
      GlobalSecondaryIndexes:
        - IndexName: "GSI1"
          KeySchema:
            - AttributeName: "GSI1PK"
              KeyType: "HASH"
            - AttributeName: "GSI1SK"
              KeyType: "RANGE"
          Projection:
            ProjectionType: "ALL"
      SSESpecification:
        SSEEnabled: true
        SSEType: "KMS"
        KMSMasterKeyId: !Ref KMSKeyArn
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      StreamSpecification:
        StreamViewType: NEW_AND_OLD_IMAGES
      Tags:
        - Key: "Name"
          Value: !Sub "nlmonorepo-${AppName}-datatable-${Stage}"

Outputs:
  DataTableName:
    Description: "Name of the DynamoDB table"
    Value: !Ref TheStoryHubDataTable
    Export:
      Name: !Sub "${AWS::StackName}-DataTableName"

  DataTableArn:
    Description: "ARN of the DynamoDB table"
    Value: !GetAtt TheStoryHubDataTable.Arn
    Export:
      Name: !Sub "${AWS::StackName}-DataTableArn"

  AppSyncDynamoDBRoleArn:
    Description: "ARN of IAM role for AppSync to access DynamoDB"
    Value: !GetAtt AppSyncDynamoDBRole.Arn
    Export:
      Name: !Sub "${AWS::StackName}-AppSyncDynamoDBRoleArn"
```

**Important:**

- Use KMSKeyArn parameter passed from parent stack (which gets it from Shared stack)
- Enable Point-in-Time Recovery for production
- Enable DynamoDB Streams for future EventBridge integration
- Use composite sort keys for efficient queries

```

```

### Prompt 3: AWS Infrastructure Setup

```
Create CloudFormation templates in deploy/templates/the-story-hub/ for the infrastructure:

1. **AppSync**: GraphQL API (following aws-example pattern - this monorepo uses AppSync, not API Gateway)
2. **Lambda Functions**: Execution role with permissions for DynamoDB, S3, CloudWatch
   - Place in deploy/templates/the-story-hub/resources/Lambda/lambda.yaml
   - Reference aws-example template structure
3. **S3 + CloudFront**:
   - Private S3 bucket for images
   - CloudFront distribution with proper cache policies
   - Folders: /story-covers/, /user-avatars/, /chapter-images/
   - Place in deploy/templates/the-story-hub/resources/S3/s3.yaml and resources/CloudFront/cloudfront.yaml
4. **Cognito**: User pool and identity pool
   - Place in deploy/templates/the-story-hub/resources/Cognito/cognito.yaml
5. **DynamoDB**: Tables for stories, users, etc.
   - Place in deploy/templates/the-story-hub/resources/DynamoDb/dynamoDb.yaml
6. **VPC**: (shared across all apps, already exists in deploy/templates/shared)
7. **WAF**: (shared across all apps, already exists in deploy/templates/waf)

Include environment variables for Lambda functions to reference table names and bucket names.
Main template: deploy/templates/the-story-hub/cfn-template.yaml
```

### ✅ PHASE 1 VERIFICATION - Infrastructure & Schema Test

````
**STOP AND TEST before proceeding to Phase 2**

**1. Verify CloudFormation Templates:**
```bash
# Validate all templates locally
cd packages/deploy/templates/the-story-hub
aws cloudformation validate-template --template-body file://cfn-template.yaml
aws cloudformation validate-template --template-body file://resources/DynamoDb/dynamoDb.yaml
aws cloudformation validate-template --template-body file://resources/AppSync/appsync.yaml
````

**2. Verify GraphQL Schema:**

```bash
# Run build-gql to merge schemas and generate types
cd packages/the-story-hub/frontend
yarn build-gql

# Verify outputs:
# - backend/combined_schema.graphql exists
# - frontend/src/types/gqlTypes.ts exists and has Story, User, ChapterNode types
```

**3. Test GraphQL Schema is Valid:**

```bash
# Install graphql-schema-linter if not present
npm install -g graphql-schema-linter

# Validate merged schema
graphql-schema-linter packages/the-story-hub/backend/combined_schema.graphql
```

**4. Verify Constants:**

```bash
# Check constants compile
cd packages/the-story-hub/backend
npx tsc --noEmit constants/ContentRatings.ts
npx tsc --noEmit constants/Genres.ts
npx tsc --noEmit constants/ContentWarnings.ts

# Test they export correctly
node -e "const { AGE_RATINGS } = require('./constants/ContentRatings'); console.log(AGE_RATINGS);"
```

**5. Deploy Infrastructure (Optional for dev environment):**

```bash
cd packages/deploy
yarn deploy --stack the-story-hub --stage dev

# This will deploy:
# - WAF stack (if not exists)
# - Shared stack (if not exists)
# - The Story Hub stack

# Verify outputs:
# - DynamoDB table created: nlmonorepo-tsh-datatable-dev
# - AppSync API created with URL
# - Cognito User Pool created
# - S3 buckets created
```

**6. Manual DynamoDB Table Inspection:**

```bash
# List tables
aws dynamodb list-tables --region ap-southeast-2 | grep tsh-datatable

# Describe table structure
aws dynamodb describe-table \
  --table-name nlmonorepo-tsh-datatable-dev \
  --region ap-southeast-2

# Verify:
# - PK and SK attributes exist
# - GSI1 exists with GSI1PK and GSI1SK
# - Encryption enabled
# - Billing mode is PAY_PER_REQUEST
```

**7. Test AppSync API (if deployed):**

```bash
# Get AppSync URL from CloudFormation outputs
aws cloudformation describe-stacks \
  --stack-name nlmonorepo-the-story-hub-dev \
  --region ap-southeast-2 \
  --query 'Stacks[0].Outputs[?OutputKey==`GraphQLApiUrl`].OutputValue' \
  --output text

# Verify schema is loaded in AppSync console
# AWS Console → AppSync → Your API → Schema
```

**Expected Results:**
✅ All CloudFormation templates validate without errors
✅ combined_schema.graphql merges all .graphql files
✅ gqlTypes.ts contains all TypeScript types
✅ Constants files compile and export correctly
✅ (If deployed) DynamoDB table exists with correct schema
✅ (If deployed) AppSync API is accessible

**If any test fails, fix before proceeding to Phase 2!**

```

---

## Phase 2: Backend GraphQL API

### Prompt 3.5: GraphQL Schema Definition
```

Create the GraphQL schema for AppSync API.

**CRITICAL:** Place schema files in `the-story-hub/backend/schema/` directory as **multiple .graphql files**

Following aws-example pattern (see packages/aws-example/backend/schema/):

- Split schema into separate files by domain
- Type definitions go in files like `Story.graphql`, `User.graphql`
- Query/Mutation operations go in files like `stories.graphql`, `users.graphql`
- The frontend build script (`yarn build-gql`) will merge these into `combined_schema.graphql`
- The combined schema is uploaded to S3 during deployment
- AppSync CloudFormation references: `s3://${TemplateBucketName}/schema.graphql`

**Build Process Flow:**

1. Create individual .graphql files in backend/schema/
2. Run `yarn build-gql` (in frontend) → merges all .graphql files
3. Generates `backend/combined_schema.graphql`
4. Runs graphql-codegen → creates `frontend/src/types/gqlTypes.ts`
5. Deployment uploads combined_schema.graphql to S3
6. AppSync loads schema from S3

**File: backend/schema/Story.graphql**

```graphql
# Story Type Definitions

enum AgeRating {
  G
  T
  M
  ADULT_18_PLUS
}

type StoryStats {
  totalBranches: Int!
  totalReads: Int!
  rating: Float
}

type Story @aws_cognito_user_pools {
  storyId: ID!
  authorId: String!
  title: String!
  synopsis: String!
  genre: [String!]!
  ageRating: AgeRating!
  contentWarnings: [String!]!
  ratingExplanation: String
  stats: StoryStats!
  featured: Boolean!
  createdAt: String!
  coverImageUrl: String
}

input CreateStoryInput {
  title: String!
  synopsis: String!
  genre: [String!]!
  ageRating: AgeRating!
  contentWarnings: [String!]!
  ratingExplanation: String
  coverImageUrl: String
}

input UpdateStoryInput {
  storyId: ID!
  title: String
  synopsis: String
  genre: [String!]
  ageRating: AgeRating
  contentWarnings: [String!]
  featured: Boolean
  coverImageUrl: String
}

input StoryFilter {
  genre: String
  ageRating: AgeRating
  minRating: Float
  featured: Boolean
}

type StoryConnection {
  items: [Story!]!
  nextToken: String
}
```

**File: backend/schema/ChapterNode.graphql**

```graphql
# Chapter/Branch Type Definitions

type ChapterStats {
  reads: Int!
  upvotes: Int!
  downvotes: Int!
  childBranches: Int!
}

type ChapterBadges {
  matchesVision: Boolean!
  authorApproved: Boolean!
}

type ChapterNode @aws_cognito_user_pools {
  nodeId: ID!
  storyId: ID!
  parentNodeId: ID
  authorId: String!
  content: String!
  branchDescription: String
  paragraphIndex: Int
  chapterNumber: Int!
  createdAt: String!
  editableUntil: String!
  stats: ChapterStats!
  badges: ChapterBadges!
}

input CreateChapterInput {
  storyId: ID!
  content: String!
  chapterNumber: Int!
}

input CreateBranchInput {
  parentNodeId: ID!
  paragraphIndex: Int
  branchDescription: String!
  content: String!
  ratingFlag: Boolean
}

input UpdateChapterInput {
  nodeId: ID!
  content: String
  branchDescription: String
}

enum VoteType {
  UP
  DOWN
}

enum BadgeType {
  MATCHES_VISION
  AUTHOR_APPROVED
}

input AwardBadgeInput {
  storyId: ID!
  nodeId: ID!
  badgeType: BadgeType!
}
```

**File: backend/schema/User.graphql**

```graphql
# User Type Definitions

enum ClientType {
  SiteAdmin
  StoryContributor
  Reader
  UnauthenticatedUser
}

type UserStats {
  storiesCreated: Int!
  branchesContributed: Int!
  totalUpvotes: Int!
}

type User @aws_cognito_user_pools {
  userId: ID!
  username: String!
  email: String!
  bio: String
  stats: UserStats!
  patreonSupporter: Boolean!
  clientType: [ClientType!]!
  createdAt: String!
}
```

**File: backend/schema/stories.graphql**

```graphql
# Story Queries and Mutations

type Query {
  getStory(storyId: ID!): Story @aws_cognito_user_pools

  listStories(
    filter: StoryFilter
    limit: Int
    nextToken: String
  ): StoryConnection @aws_cognito_user_pools

  getStoryTree(storyId: ID!): TreeData @aws_cognito_user_pools

  getReadingPath(storyId: ID!, nodePath: [ID!]!): [ChapterNode!]!
    @aws_cognito_user_pools
}

type Mutation {
  createStory(input: CreateStoryInput!): Story @aws_cognito_user_pools

  updateStory(input: UpdateStoryInput!): Story @aws_cognito_user_pools
}

# Tree visualization data structure
type TreeData {
  rootNode: TreeNode!
  totalNodes: Int!
}

type TreeNode {
  nodeId: ID!
  title: String!
  description: String
  stats: ChapterStats!
  badges: ChapterBadges!
  authorId: String!
  children: [TreeNode!]!
}
```

**File: backend/schema/chapters.graphql**

```graphql
# Chapter/Branch Queries and Mutations

type Query {
  getChapter(nodeId: ID!): ChapterNode @aws_cognito_user_pools

  listBranches(nodeId: ID!): [ChapterNode!]! @aws_cognito_user_pools
}

type Mutation {
  createChapter(input: CreateChapterInput!): ChapterNode @aws_cognito_user_pools

  createBranch(input: CreateBranchInput!): ChapterNode @aws_cognito_user_pools

  updateChapter(input: UpdateChapterInput!): ChapterNode @aws_cognito_user_pools

  voteOnChapter(nodeId: ID!, voteType: VoteType!): ChapterNode
    @aws_cognito_user_pools

  awardBadge(input: AwardBadgeInput!): ChapterNode @aws_cognito_user_pools
}
```

**File: backend/schema/users.graphql**

```graphql
# User Queries and Mutations

type Query {
  getUserProfile(userId: ID!): User @aws_cognito_user_pools
}
```

**File: backend/schema/bookmarks.graphql**

```graphql
# Bookmark Type and Operations

type Bookmark @aws_cognito_user_pools {
  userId: ID!
  storyId: ID!
  currentNodeId: ID!
  breadcrumbs: [String!]!
  lastRead: String!
}

input SaveBookmarkInput {
  storyId: ID!
  currentNodeId: ID!
  breadcrumbs: [String!]!
}

type Query {
  getBookmark(storyId: ID!): Bookmark @aws_cognito_user_pools
}

type Mutation {
  saveBookmark(input: SaveBookmarkInput!): Bookmark @aws_cognito_user_pools
}
```

**File: backend/schema/subscriptions.graphql**

```graphql
# Real-time Subscriptions

type Subscription {
  onNewNotification(userId: ID!): Notification
    @aws_subscribe(mutations: ["createNotification"])

  onNewBranch(storyId: ID!): ChapterNode
    @aws_subscribe(mutations: ["createBranch"])
}

type Notification @aws_cognito_user_pools {
  notificationId: ID!
  userId: ID!
  type: String!
  message: String!
  read: Boolean!
  relatedNodeId: ID
  createdAt: String!
}
```

**Important AppSync Directives:**

- `@aws_cognito_user_pools` - Requires Cognito authentication
- `@aws_iam` - Allows IAM-based access (for internal Lambda calls)
- `@aws_subscribe(mutations: [...])` - Defines subscription triggers

**TypeScript Type Generation:**
After creating these schema files, `yarn build-gql` will:

1. Merge them into combined_schema.graphql
2. Generate frontend/src/types/gqlTypes.ts with all types
3. Import in resolvers: `import { Story, CreateStoryInput } from "gqlTypes"`

```

### Prompt 4: Story CRUD Operations
```

Create AppSync Pipeline Resolvers in TypeScript for story operations.

**CRITICAL RESOLVER ARCHITECTURE:**
Following aws-example pattern (see packages/aws-example/backend/resolvers/):

- Each resolver is a TypeScript file with TWO exports: `request()` and `response()`
- Request function: Prepares DynamoDB operation (PutItem, GetItem, Query, UpdateItem)
- Response function: Transforms DynamoDB result to GraphQL type
- Import types from auto-generated: `import { Story, CreateStoryInput } from "gqlTypes"`
- Import AppSync utilities: `import { util, Context, AppSyncIdentityCognito } from "@aws-appsync/utils"`

**Resolver File Structure:**

```
backend/resolvers/stories/
  ├── Mutations/
  │   ├── Mutation.createStory.ts
  │   └── Mutation.updateStory.ts
  └── Queries/
      ├── Query.getStory.ts
      └── Query.listStories.ts
```

**RESOLVER PATTERN EXAMPLE - Mutation.createStory.ts:**

```typescript
import { util, Context, AppSyncIdentityCognito } from "@aws-appsync/utils";
import { Story, CreateStoryInput, CreateStoryMutation } from "gqlTypes";

// Context type for this resolver
type CTX = Context<
  { input: CreateStoryInput }, // Args
  object, // Source
  object, // PrevResult
  object, // Info
  Story // Result
>;

export function request(ctx: CTX) {
  const { input } = ctx.args;
  const identity = ctx.identity as AppSyncIdentityCognito;

  // Generate unique ID
  const storyId = util.autoId();
  const now = util.time.nowISO8601();

  console.log(`Creating story for user: ${identity.username}`);

  // Validate ageRating using constants
  // (Import from backend/constants/ContentRatings.ts)

  return {
    operation: "PutItem",
    key: util.dynamodb.toMapValues({
      PK: `STORY#${storyId}`,
      SK: "METADATA",
    }),
    attributeValues: util.dynamodb.toMapValues({
      storyId,
      authorId: identity.username,
      ...input,
      stats: {
        totalBranches: 0,
        totalReads: 0,
        rating: null,
      },
      featured: false,
      createdAt: now,
      // For browse/discover queries
      GSI1PK: "STORY_LIST",
      GSI1SK: `${now}#${storyId}`,
    }),
  };
}

export function response(ctx: CTX): Story {
  if (ctx.error) {
    console.error("Error creating story:", ctx.error);
    util.error(ctx.error.message, ctx.error.type);
  }

  console.log("Story created successfully:", ctx.result);
  return ctx.result as Story;
}
```

**RESOLVER PATTERN EXAMPLE - Query.getStory.ts:**

```typescript
import { util, Context, AppSyncIdentityCognito } from "@aws-appsync/utils";
import { Story, GetStoryQueryVariables } from "gqlTypes";

type CTX = Context<GetStoryQueryVariables, object, object, object, Story>;

export function request(ctx: CTX) {
  const { storyId } = ctx.args;

  if (!storyId) {
    util.error("storyId is required", "ValidationException");
  }

  console.log(`Fetching story: ${storyId}`);

  return {
    operation: "GetItem",
    key: util.dynamodb.toMapValues({
      PK: `STORY#${storyId}`,
      SK: "METADATA",
    }),
  };
}

export function response(ctx: CTX): Story {
  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type);
  }

  const item = ctx.result;

  if (!item) {
    util.error(`Story not found: ${ctx.args.storyId}`, "NotFound");
  }

  return item as Story;
}
```

**RESOLVER PATTERN EXAMPLE - Query.listStories.ts:**

```typescript
import { util, Context } from "@aws-appsync/utils";
import { ListStoriesQueryVariables, StoryConnection } from "gqlTypes";

type CTX = Context<
  ListStoriesQueryVariables,
  object,
  object,
  object,
  StoryConnection
>;

export function request(ctx: CTX) {
  const { filter, limit = 20, nextToken } = ctx.args;

  console.log("Listing stories with filter:", filter);

  // Query GSI1 for story list
  return {
    operation: "Query",
    index: "GSI1",
    query: {
      expression: "GSI1PK = :pk",
      expressionValues: util.dynamodb.toMapValues({
        ":pk": "STORY_LIST",
      }),
    },
    limit,
    nextToken,
    scanIndexForward: false, // Newest first
  };
}

export function response(ctx: CTX): StoryConnection {
  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type);
  }

  const { items = [], nextToken } = ctx.result;

  // Filter by genre/ageRating if provided
  let filteredItems = items;
  if (ctx.args.filter?.genre) {
    filteredItems = items.filter((item: any) =>
      item.genre?.includes(ctx.args.filter.genre),
    );
  }

  return {
    items: filteredItems,
    nextToken,
  };
}
```

**RESOLVER PATTERN EXAMPLE - Mutation.updateStory.ts:**

```typescript
import { util, Context, AppSyncIdentityCognito } from "@aws-appsync/utils";
import { Story, UpdateStoryInput } from "gqlTypes";

type CTX = Context<{ input: UpdateStoryInput }, object, object, object, Story>;

export function request(ctx: CTX) {
  const { input } = ctx.args;
  const identity = ctx.identity as AppSyncIdentityCognito;

  // First, we need to verify the user is the author
  // This requires a two-step process or a pipeline resolver
  // For now, we'll do authorization check in response

  const updateExpression: string[] = [];
  const expressionNames: Record<string, string> = {};
  const expressionValues: Record<string, any> = {};

  if (input.title) {
    updateExpression.push("#title = :title");
    expressionNames["#title"] = "title";
    expressionValues[":title"] = input.title;
  }

  if (input.synopsis) {
    updateExpression.push("#synopsis = :synopsis");
    expressionNames["#synopsis"] = "synopsis";
    expressionValues[":synopsis"] = input.synopsis;
  }

  if (input.ageRating) {
    // TODO: Add logic to ensure ageRating can only increase
    updateExpression.push("#ageRating = :ageRating");
    expressionNames["#ageRating"] = "ageRating";
    expressionValues[":ageRating"] = input.ageRating;
  }

  return {
    operation: "UpdateItem",
    key: util.dynamodb.toMapValues({
      PK: `STORY#${input.storyId}`,
      SK: "METADATA",
    }),
    update: {
      expression: `SET ${updateExpression.join(", ")}`,
      expressionNames,
      expressionValues: util.dynamodb.toMapValues(expressionValues),
    },
    // Only update if author matches
    condition: {
      expression: "authorId = :authorId",
      expressionValues: util.dynamodb.toMapValues({
        ":authorId": identity.username,
      }),
    },
  };
}

export function response(ctx: CTX): Story {
  if (ctx.error) {
    if (ctx.error.type === "ConditionalCheckFailedException") {
      util.error(
        "Unauthorized: Only the story author can update",
        "Unauthorized",
      );
    }
    util.error(ctx.error.message, ctx.error.type);
  }

  return ctx.result as Story;
}
```

**BUILD AND DEPLOYMENT PROCESS:**

1. Write resolvers in TypeScript in backend/resolvers/
2. Deploy script compiles TypeScript → JavaScript
3. JavaScript resolvers uploaded to S3
4. AppSync CloudFormation creates AWS::AppSync::Resolver resources
5. Each resolver resource references S3 location

**CloudFormation Resolver Resource Example:**

```yaml
# In deploy/templates/the-story-hub/resources/AppSync/appsync.yaml

CreateStoryResolver:
  Type: AWS::AppSync::Resolver
  Properties:
    ApiId: !GetAtt GraphQlApi.ApiId
    TypeName: Mutation
    FieldName: createStory
    DataSourceName: !GetAtt MainTableDataSource.Name
    Kind: UNIT
    Runtime:
      Name: APPSYNC_JS
      RuntimeVersion: 1.0.0
    CodeS3Location: !Sub "s3://${TemplateBucketName}/resolvers/stories/Mutations/Mutation.createStory.js"
```

**IMPORTANT NOTES:**

- NO Zod validation in resolvers - GraphQL schema handles input validation
- Use DynamoDB atomic counters for stats: `ADD #reads :inc`
- Error handling with util.error() throws GraphQL errors
- All console.log() output goes to CloudWatch Logs
- Types are imported from "gqlTypes" (module alias in tsconfig)

```

```

### Prompt 5: Chapter/Branch Operations

```
Create AppSync resolvers for chapter and branching operations.
Place in: the-story-hub/backend/resolvers/chapters/

**Follow the EXACT pattern from Prompt 4** with request/response functions.

**Resolver Files to Create:**
```

backend/resolvers/chapters/
├── Mutations/
│ ├── Mutation.createChapter.ts
│ ├── Mutation.createBranch.ts
│ ├── Mutation.updateChapter.ts
│ └── Mutation.voteOnChapter.ts
└── Queries/
├── Query.getChapter.ts
└── Query.listBranches.ts

````

**Key Implementation Details:**

**Mutation.createChapter.ts:**
- PK: `STORY#{storyId}`, SK: `NODE#{nodeId}`
- Set GSI1PK: `USER#{authorId}`, GSI1SK: `BRANCH#{createdAt}#{nodeId}`
- Initialize stats: `{ reads: 0, upvotes: 0, downvotes: 0, childBranches: 0 }`
- Set editableUntil: `util.time.nowEpochMilliSeconds() + 3600000` (1 hour)
- Atomic increment story's totalBranches counter

**Mutation.createBranch.ts:**
- Same as createChapter but with parentNodeId
- If ratingFlag=true, create notification item (separate PutItem in pipeline)
- Atomic increment parent's childBranches: `ADD #childBranches :inc`

**Query.getChapter.ts:**
- GetItem with PK: `STORY#{storyId}`, SK: `NODE#{nodeId}`
- In response function, atomic increment reads counter using second DynamoDB call

**Query.listBranches.ts:**
- Query with PK: `NODE#{parentNodeId}`, SK begins_with `CHILD#`
- Or Query main table where PK = parent storyId and filter by parentNodeId
- Sort by stats in response function

**Mutation.updateChapter.ts:**
- Condition expression: `editableUntil > :now AND authorId = :userId`
- If condition fails → util.error("Edit window expired or unauthorized")

**Mutation.voteOnChapter.ts:**
- First check if user already voted: GetItem USER#{userId}, SK: VOTE#{nodeId}
- If exists → util.error("Already voted")
- Else: PutItem vote record + UpdateItem with atomic ADD for upvotes/downvotes

**DynamoDB Atomic Counter Pattern:**
```typescript
return {
  operation: "UpdateItem",
  key: util.dynamodb.toMapValues({
    PK: `STORY#{storyId}`,
    SK: `NODE#{nodeId}`,
  }),
  update: {
    expression: "ADD #reads :inc",
    expressionNames: {
      "#reads": "stats.reads",
    },
    expressionValues: util.dynamodb.toMapValues({
      ":inc": 1,
    }),
  },
};
````

Reference Prompt 4 for complete resolver pattern examples.

```

### Prompt 6: Reading Path & Tree Data
```

Create AppSync resolvers for reading flow. **Follow Prompt 4 pattern**.
Place in: the-story-hub/backend/resolvers/reading/

**Query.getStoryTree.ts:**

- Query all chapters: PK = `STORY#{storyId}`, SK begins_with `NODE#`
- In response function, build tree structure recursively
- Return TreeData with rootNode and totalNodes

**Query.getReadingPath.ts:**

- Use DynamoDB BatchGetItem to fetch multiple chapters efficiently
- Map nodePath array to keys: `{ PK: STORY#{storyId}, SK: NODE#{nodeId} }`
- Return ordered array matching nodePath order

**Mutation.saveBookmark.ts:**

- PutItem with PK: `USER#{userId}`, SK: `BOOKMARK#{storyId}`
- Include currentNodeId, breadcrumbs array, lastRead timestamp

**Query.getBookmark.ts:**

- GetItem with PK: `USER#{userId}`, SK: `BOOKMARK#{storyId}`
- Return bookmark or null if not found

```

### Prompt 7: User & Social Features
```

Create AppSync resolvers. **Follow Prompt 4 pattern**.
Place in: backend/resolvers/users/ and backend/resolvers/social/

**Query.getUserProfile.ts:**

- GetItem: PK = `USER#{userId}`, SK = `PROFILE#{userId}`
- Optional: Query GSI1 to get user's stories/branches count

**Mutation.awardBadge.ts:**

- Authorization check in request():
  - Get story to verify authorId = ctx.identity.username
  - Use conditional UpdateItem
- UpdateItem chapter node with badge: `SET badges.{badgeType} = :true`

**Query.listNotifications.ts:**

- Query: PK = `USER#{userId}`, SK begins_with `NOTIFICATION#`
- Filter by read/unread in response function
- Return paginated results with nextToken

(voteOnChapter covered in Prompt 5)

```

### Prompt 8: Image Upload
```

Create AppSync resolvers and Lambda functions for image management.

**Mutation.getPresignedUploadUrl.ts** (AppSync Resolver calling Lambda):

- Use Lambda Function data source (not direct DynamoDB)
- Lambda generates presigned S3 URL with AWS SDK
- Return: { uploadUrl, imageId, fields }

**Lambda Function: backend/lambda/generatePresignedUrl.ts:**

```typescript
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const handler = async (event: any) => {
  const { imageType, userId } = event.arguments.input;
  const imageId = generateId();
  const key = `${imageType}/${userId}/${imageId}.jpg`;

  const command = new PutObjectCommand({
    Bucket: process.env.UPLOAD_BUCKET,
    Key: key,
    ContentType: "image/jpeg",
  });

  const uploadUrl = await getSignedUrl(s3Client, command, {
    expiresIn: 300,
  });

  return { uploadUrl, imageId, key };
};
```

**Lambda Function: backend/lambda/processImage.ts** (S3 Trigger):

- Triggered by S3 event on PUT
- Use Sharp to resize/optimize
- Generate WebP version
- Store metadata in DynamoDB: PK = `IMAGE#{imageId}`, SK = `METADATA`

**Mutation.deleteImage.ts:**

- Check authorization: Get image metadata, verify userId = ctx.identity.username
- Call Lambda to delete from S3
- DeleteItem from DynamoDB

```

### ✅ PHASE 2 VERIFICATION - Resolver & Database Test
```

**STOP AND TEST before proceeding to Phase 3**

**1. Compile All Resolvers:**

```bash
cd packages/the-story-hub/backend
npx tsc --noEmit resolvers/**/*.ts

# Verify no compilation errors
# Check that all resolvers import types from "gqlTypes" correctly
```

**2. Create Database Seeding Script:**

**backend/scripts/seed-db.ts:**

```typescript
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "ap-southeast-2" });
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.TABLE_NAME || "nlmonorepo-tsh-datatable-dev";

async function seedDatabase() {
  console.log("🌱 Seeding The Story Hub database...");

  // Create test users
  const users = [
    {
      PK: "USER#test-user-1",
      SK: "PROFILE#test-user-1",
      userId: "test-user-1",
      username: "storyteller_alice",
      email: "alice@example.com",
      bio: "Love creating branching narratives!",
      stats: { storiesCreated: 2, branchesContributed: 5, totalUpvotes: 15 },
      patreonSupporter: false,
      clientType: ["StoryContributor"],
      createdAt: new Date().toISOString(),
    },
    {
      PK: "USER#test-user-2",
      SK: "PROFILE#test-user-2",
      userId: "test-user-2",
      username: "branch_master_bob",
      email: "bob@example.com",
      bio: "Collaborative storytelling enthusiast",
      stats: { storiesCreated: 1, branchesContributed: 12, totalUpvotes: 45 },
      patreonSupporter: true,
      clientType: ["StoryContributor"],
      createdAt: new Date().toISOString(),
    },
  ];

  // Create test stories
  const stories = [
    {
      PK: "STORY#story-1",
      SK: "METADATA",
      storyId: "story-1",
      authorId: "test-user-1",
      title: "The Enchanted Forest Chronicles",
      synopsis:
        "A magical forest where every path leads to a different adventure. What will you discover?",
      genre: ["Fantasy", "Adventure"],
      ageRating: "T",
      contentWarnings: [],
      stats: { totalBranches: 8, totalReads: 156, rating: 4.5 },
      featured: true,
      createdAt: "2025-01-01T10:00:00Z",
      GSI1PK: "STORY_LIST",
      GSI1SK: "2025-01-01T10:00:00Z#story-1",
    },
    {
      PK: "STORY#story-2",
      SK: "METADATA",
      storyId: "story-2",
      authorId: "test-user-2",
      title: "Cyberpunk Decisions",
      synopsis:
        "In a neon-lit future, your choices shape the fate of Neo-Tokyo.",
      genre: ["Sci-Fi", "Cyberpunk"],
      ageRating: "M",
      contentWarnings: ["Violence/Gore"],
      stats: { totalBranches: 15, totalReads: 234, rating: 4.8 },
      featured: true,
      createdAt: "2025-01-15T14:30:00Z",
      GSI1PK: "STORY_LIST",
      GSI1SK: "2025-01-15T14:30:00Z#story-2",
    },
  ];

  // Create test chapters
  const chapters = [
    {
      PK: "STORY#story-1",
      SK: "NODE#chapter-1-1",
      nodeId: "chapter-1-1",
      storyId: "story-1",
      parentNodeId: null,
      authorId: "test-user-1",
      content:
        "You step into the enchanted forest, sunlight filtering through ancient trees. Two paths diverge before you: one leads deeper into darkness, the other towards a shimmering glade.",
      branchDescription: null,
      chapterNumber: 1,
      createdAt: "2025-01-01T10:05:00Z",
      editableUntil: "2025-01-01T11:05:00Z",
      stats: { reads: 156, upvotes: 23, downvotes: 2, childBranches: 2 },
      badges: { matchesVision: true, authorApproved: true },
      GSI1PK: "USER#test-user-1",
      GSI1SK: "BRANCH#2025-01-01T10:05:00Z#chapter-1-1",
    },
    {
      PK: "STORY#story-1",
      SK: "NODE#chapter-1-2",
      nodeId: "chapter-1-2",
      storyId: "story-1",
      parentNodeId: "chapter-1-1",
      authorId: "test-user-2",
      content:
        "You choose the dark path. Strange whispers echo through the trees, and glowing eyes watch from the shadows...",
      branchDescription: "Take the dark path",
      chapterNumber: 2,
      createdAt: "2025-01-02T09:00:00Z",
      editableUntil: "2025-01-02T10:00:00Z",
      stats: { reads: 89, upvotes: 15, downvotes: 1, childBranches: 1 },
      badges: { matchesVision: true, authorApproved: false },
      GSI1PK: "USER#test-user-2",
      GSI1SK: "BRANCH#2025-01-02T09:00:00Z#chapter-1-2",
    },
  ];

  // Insert all data
  for (const user of users) {
    await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: user }));
    console.log(`✅ Created user: ${user.username}`);
  }

  for (const story of stories) {
    await docClient.send(
      new PutCommand({ TableName: TABLE_NAME, Item: story }),
    );
    console.log(`✅ Created story: ${story.title}`);
  }

  for (const chapter of chapters) {
    await docClient.send(
      new PutCommand({ TableName: TABLE_NAME, Item: chapter }),
    );
    console.log(`✅ Created chapter: ${chapter.nodeId}`);
  }

  console.log("🎉 Database seeding complete!");
}

seedDatabase().catch(console.error);
```

**Run seeding:**

```bash
cd packages/the-story-hub/backend
TABLE_NAME=nlmonorepo-tsh-datatable-dev \
  npx ts-node scripts/seed-db.ts
```

**3. Test Resolvers with Jest:**

**backend/resolvers/**tests**/Query.getStory.test.ts:**

```typescript
import { request, response } from "../stories/Queries/Query.getStory";
import { util } from "@aws-appsync/utils";

describe("Query.getStory", () => {
  it("should create correct GetItem request", () => {
    const ctx = {
      args: { storyId: "story-1" },
      identity: {},
    } as any;

    const result = request(ctx);

    expect(result.operation).toBe("GetItem");
    expect(result.key).toEqual({
      PK: { S: "STORY#story-1" },
      SK: { S: "METADATA" },
    });
  });

  it("should return story from response", () => {
    const ctx = {
      result: {
        storyId: "story-1",
        title: "Test Story",
        authorId: "user-1",
      },
      error: null,
    } as any;

    const result = response(ctx);

    expect(result.storyId).toBe("story-1");
    expect(result.title).toBe("Test Story");
  });

  it("should throw error if story not found", () => {
    const ctx = {
      args: { storyId: "nonexistent" },
      result: null,
      error: null,
    } as any;

    expect(() => response(ctx)).toThrow();
  });
});
```

**Run resolver tests:**

```bash
cd packages/the-story-hub/backend
yarn test resolvers/

# Or with coverage
yarn test --coverage resolvers/
```

**4. Deploy Resolvers:**

```bash
cd packages/deploy
yarn deploy --stack the-story-hub --stage dev

# This compiles resolvers and uploads to S3
# AppSync loads them automatically
```

**5. Test Resolvers via AppSync Console:**

```bash
# AWS Console → AppSync → Your API → Queries

# Test getStory:
query GetStory {
  getStory(storyId: "story-1") {
    storyId
    title
    authorId
    synopsis
    stats {
      totalBranches
      totalReads
      rating
    }
  }
}

# Test listStories:
query ListStories {
  listStories(limit: 10) {
    items {
      storyId
      title
      genre
      stats {
        totalReads
      }
    }
    nextToken
  }
}
```

**6. Test with AWS CLI:**

```bash
# Get AppSync API details
APPSYNC_URL=$(aws cloudformation describe-stacks \
  --stack-name nlmonorepo-the-story-hub-dev \
  --query 'Stacks[0].Outputs[?OutputKey==`GraphQLApiUrl`].OutputValue' \
  --output text)

# Create Cognito user for testing
aws cognito-idp admin-create-user \
  --user-pool-id YOUR_POOL_ID \
  --username testuser1 \
  --temporary-password TempPass123!

# Get auth token and test mutations (requires authenticated request)
```

**Expected Results:**
✅ All resolvers compile without errors
✅ Database seeding creates users, stories, and chapters
✅ Jest tests pass for resolver logic
✅ AppSync console queries return seeded data
✅ getStory returns "The Enchanted Forest Chronicles"
✅ listStories returns both seeded stories

**Common Issues:**

- ❌ "Cannot find module 'gqlTypes'" → Run `yarn build-gql` first
- ❌ "AccessDeniedException" → Check AppSync IAM roles in DynamoDB template
- ❌ "Table not found" → Verify table name in environment variables

**If any test fails, fix resolvers before proceeding to Phase 3!**

```

---

## Phase 3: Frontend Application

### Prompt 9: Next.js App Structure & Routing + Amplify GraphQL Client Setup
```

Set up Next.js 15 App Router structure in the-story-hub/frontend.

**CRITICAL: AWS Amplify GraphQL Client Configuration**

**1. Create lib/amplify.ts:**

```typescript
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/api";

// Configure Amplify (call this once in app/layout.tsx)
export function configureAmplify() {
  Amplify.configure(
    {
      API: {
        GraphQL: {
          endpoint: process.env.NEXT_PUBLIC_APPSYNC_URL!,
          region: process.env.NEXT_PUBLIC_AWS_REGION!,
          defaultAuthMode: "userPool",
        },
      },
      Auth: {
        Cognito: {
          userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID!,
          userPoolClientId: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID!,
          region: process.env.NEXT_PUBLIC_AWS_REGION!,
        },
      },
    },
    { ssr: true },
  );
}

// Generate GraphQL client
export const client = generateClient();
```

**2. Create graphql/ directory with operations:**

**graphql/mutations.ts:**

```typescript
export const createStory = /* GraphQL */ `
  mutation CreateStory($input: CreateStoryInput!) {
    createStory(input: $input) {
      storyId
      authorId
      title
      synopsis
      genre
      ageRating
      contentWarnings
      stats {
        totalBranches
        totalReads
        rating
      }
      createdAt
    }
  }
`;

export const createBranch = /* GraphQL */ `
  mutation CreateBranch($input: CreateBranchInput!) {
    createBranch(input: $input) {
      nodeId
      storyId
      parentNodeId
      authorId
      content
      branchDescription
      createdAt
    }
  }
`;
// ... other mutations
```

**graphql/queries.ts:**

```typescript
export const getStory = /* GraphQL */ `
  query GetStory($storyId: ID!) {
    getStory(storyId: $storyId) {
      storyId
      title
      synopsis
      authorId
      genre
      ageRating
      stats {
        totalBranches
        totalReads
        rating
      }
      createdAt
    }
  }
`;

export const listStories = /* GraphQL */ `
  query ListStories($filter: StoryFilter, $limit: Int, $nextToken: String) {
    listStories(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        storyId
        title
        synopsis
        authorId
        genre
        ageRating
        stats {
          totalBranches
          totalReads
          rating
        }
      }
      nextToken
    }
  }
`;
// ... other queries
```

**3. Create lib/api/ with typed wrappers:**

**lib/api/stories.ts:**

```typescript
import { client } from "@/lib/amplify";
import { createStory, updateStory } from "@/graphql/mutations";
import { getStory, listStories } from "@/graphql/queries";
import type {
  Story,
  CreateStoryInput,
  UpdateStoryInput,
  StoryFilter,
  StoryConnection,
} from "@/types/gqlTypes";

export async function createStoryAPI(input: CreateStoryInput): Promise<Story> {
  const result = await client.graphql({
    query: createStory,
    variables: { input },
  });
  return result.data.createStory;
}

export async function getStoryAPI(storyId: string): Promise<Story | null> {
  const result = await client.graphql({
    query: getStory,
    variables: { storyId },
  });
  return result.data.getStory;
}

export async function listStoriesAPI(
  filter?: StoryFilter,
  limit?: number,
  nextToken?: string,
): Promise<StoryConnection> {
  const result = await client.graphql({
    query: listStories,
    variables: { filter, limit, nextToken },
  });
  return result.data.listStories;
}
```

**4. Configure app/layout.tsx:**

```typescript
import { configureAmplify } from '@/lib/amplify';

// Call once at root
configureAmplify();

export default function RootLayout({ children }: { children: React.Node }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
```

**5. Create Zod schemas for form validation** (frontend/src/types/):

**types/StorySchemas.ts:**

```typescript
import { z } from "zod";
import { AgeRating } from "./gqlTypes";

export const CreateStoryFormSchema = z.object({
  title: z.string().min(3).max(200),
  synopsis: z.string().min(50).max(2000),
  genre: z.array(z.string()).min(1, "Select at least one genre"),
  ageRating: z.nativeEnum(AgeRating),
  contentWarnings: z.array(z.string()),
  ratingExplanation: z.string().optional(),
  chapterContent: z
    .string()
    .min(500, "Chapter must be at least 500 characters"),
});

export type CreateStoryFormData = z.infer<typeof CreateStoryFormSchema>;
```

**Route Structure:**

1. **app/(auth)/login** - Login with Amplify Auth
2. **app/(auth)/signup** - Signup
3. **app/page.tsx** - Landing (calls listStoriesAPI)
4. **app/browse/page.tsx** - Browse/search
5. **app/story/create/page.tsx** - Create story (calls createStoryAPI)
6. **app/story/[storyId]/page.tsx** - Story overview
7. **app/story/[storyId]/read/[[...nodePath]]/page.tsx** - Reading view
8. **app/story/[storyId]/branch/[nodeId]/page.tsx** - Branch form
9. **app/profile/[userId]/page.tsx** - User profile

**Environment Variables (.env.local):**

```
NEXT_PUBLIC_APPSYNC_URL=https://xxx.appsync-api.ap-southeast-2.amazonaws.com/graphql
NEXT_PUBLIC_USER_POOL_ID=ap-southeast-2_xxxxx
NEXT_PUBLIC_USER_POOL_CLIENT_ID=xxxxxxxxxxxxx
NEXT_PUBLIC_AWS_REGION=ap-southeast-2
```

**IMPORTANT:**

- Types from src/types/gqlTypes.ts are auto-generated by `yarn build-gql`
- GraphQL operations use template literal syntax for codegen
- Amplify client handles authentication automatically
- Use TanStack Query to wrap API calls for caching/refetching

```

### Prompt 10: Landing Page & Browse
```

Build the landing page (app/page.tsx) with NextUI components.

**Data Fetching with TanStack Query:**

```typescript
"use client";
import { useQuery } from "@tanstack/react-query";
import { listStoriesAPI } from "@/lib/api/stories";

export default function LandingPage() {
  const { data: featuredStories } = useQuery({
    queryKey: ["stories", "featured"],
    queryFn: () => listStoriesAPI({ featured: true }, 6),
  });

  const { data: trendingStories } = useQuery({
    queryKey: ["stories", "trending"],
    queryFn: () => listStoriesAPI({}, 6), // Sort by reads in resolver
  });

  // Render story cards...
}
```

Requirements:

- Hero section with catchy tagline
- Grid sections using listStoriesAPI with different filters
- Story cards with cover, title, author, genre tags, stats
- Mobile responsive with Framer Motion animations
- Use NextUI Card, Button, Chip components

```

### Prompt 11: Story Creation Flow
```

Create the story creation page (app/story/create/page.tsx):

Form with react-hook-form + Zod validation:

1. Story title (required, 3-200 chars)
2. Synopsis (required, 50-2000 chars) - textarea with character count
3. Genre selection (multi-select, at least 1 required)
4. **Age rating selection (required, with clear descriptions)**
5. **Content warnings (checkboxes + custom input)**
6. Cover image upload (optional) - show preview
7. Chapter 1 content (required, 500+ chars) - rich text editor

Features:

- Real-time character counts
- Preview mode (show how it will look)
- Save as draft (localStorage for now)
- Auto-save every 30 seconds to localStorage
- Clear validation error messages
- Loading states during submission
- Success redirect to story page

Use NextUI Input, Textarea, Select components.
Style with Tailwind for clean form layout.

**Form Submission with GraphQL mutations:**

```typescript
import { useMutation } from "@tanstack/react-query";
import { createStoryAPI } from "@/lib/api/stories";
import { createChapterAPI } from "@/lib/api/chapters";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateStoryFormSchema } from "@/types/StorySchemas";

const { mutateAsync: createStory } = useMutation({
  mutationFn: createStoryAPI,
});

const onSubmit = async (data: CreateStoryFormData) => {
  // 1. Upload cover image (if provided)
  if (data.coverImage) {
    const { uploadUrl } = await getPresignedUploadUrlAPI({
      imageType: "story-cover",
    });
    await fetch(uploadUrl, { method: "PUT", body: data.coverImage });
  }

  // 2. Create story
  const story = await createStory({
    title: data.title,
    synopsis: data.synopsis,
    genre: data.genre,
    ageRating: data.ageRating,
    contentWarnings: data.contentWarnings,
  });

  // 3. Create Chapter 1
  await createChapterAPI({
    storyId: story.storyId,
    content: data.chapterContent,
    chapterNumber: 1,
  });

  // 4. Redirect
  router.push(`/story/${story.storyId}`);
};
```

Use Zod for validation, AWS Amplify GraphQL client for API calls.

```

### Prompt 12: Tree Visualization Component
```

Create a TreeVisualization component using React Flow (reactflow):

**Install dependencies:**

```bash
yarn add reactflow
```

**Requirements:**

- Fetch tree data from getStoryTree GraphQL query
- Transform tree data into React Flow nodes and edges format
- Display interactive node-based graph showing:
  - Synopsis at root
  - Chapter 1 as first node
  - All branches as connected tree structure
  - Custom node styling:
    - Gold border for "matches vision" nodes
    - Blue border for "author approved"
    - Gray for regular branches
    - Node size based on popularity/reads
    - Display chapter title/description in node
- Built-in zoom and pan controls (React Flow handles this)
- On node click: navigate to that chapter in reading view
- Custom node component with:
  - Chapter title/branch description
  - Author name
  - Stats (reads, upvotes)
  - Badges (matches vision, author approved)
  - "Read from here" button
- Edge styling: smooth bezier curves
- Layout algorithm: hierarchical tree layout (top-to-bottom)
- Mobile-friendly (React Flow is responsive, add vertical layout for mobile)

**Implementation example:**

```typescript
'use client';
import { useCallback, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useQuery } from '@tanstack/react-query';
import { getStoryTreeAPI } from '@/lib/api/stories';

// Custom node component
function StoryNode({ data }: { data: any }) {
  return (
    <div className={`
      px-4 py-3 rounded-lg border-2 shadow-lg
      ${data.matchesVision ? 'border-yellow-500' : ''}
      ${data.authorApproved ? 'border-blue-500' : 'border-gray-300'}
      bg-white dark:bg-gray-800
    `}>
      <div className="font-semibold text-sm">{data.title}</div>
      <div className="text-xs text-gray-600 dark:text-gray-400">
        {data.authorName}
      </div>
      <div className="flex gap-2 mt-2 text-xs">
        <span>👁 {data.reads}</span>
        <span>⬆ {data.upvotes}</span>
      </div>
      {data.matchesVision && (
        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded mt-1 inline-block">
          ✨ Author's Vision
        </span>
      )}
    </div>
  );
}

const nodeTypes = {
  storyNode: StoryNode,
};

export function TreeVisualization({ storyId }: { storyId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['storyTree', storyId],
    queryFn: () => getStoryTreeAPI(storyId),
  });

  // Transform tree data to React Flow format
  const { nodes, edges } = useMemo(() => {
    if (!data) return { nodes: [], edges: [] };

    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Transform your tree data to nodes/edges
    // Example:
    data.nodes.forEach((node, index) => {
      nodes.push({
        id: node.nodeId,
        type: 'storyNode',
        position: { x: index * 200, y: Math.floor(index / 5) * 150 }, // Basic layout
        data: {
          title: node.title,
          authorName: node.authorName,
          reads: node.stats.reads,
          upvotes: node.stats.upvotes,
          matchesVision: node.matchesVision,
          authorApproved: node.authorApproved,
        },
      });

      if (node.parentNodeId) {
        edges.push({
          id: `${node.parentNodeId}-${node.nodeId}`,
          source: node.parentNodeId,
          target: node.nodeId,
          type: 'smoothstep',
          animated: true,
          markerEnd: { type: MarkerType.ArrowClosed },
        });
      }
    });

    return { nodes, edges };
  }, [data]);

  const onNodeClick = useCallback((event: any, node: Node) => {
    // Navigate to reading view
    window.location.href = `/story/${storyId}/read/${node.id}`;
  }, [storyId]);

  if (isLoading) {
    return <div className="h-96 animate-pulse bg-gray-200 rounded" />;
  }

  return (
    <div className="h-[600px] w-full border rounded-lg">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        fitView
        minZoom={0.1}
        maxZoom={2}
      >
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  );
}
```

**For better tree layout, use dagre or elkjs:**

```bash
yarn add dagre @types/dagre
```

```typescript
import dagre from "dagre";

function getLayoutedElements(nodes: Node[], edges: Edge[]) {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: "TB" }); // Top to Bottom

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 200, height: 100 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x,
        y: nodeWithPosition.y,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}
```

**Styling:**

- Dark mode friendly (use Tailwind dark: classes)
- Smooth animations (React Flow has built-in)
- Legend explaining colors/badges
- Mobile: Use `fitView` and responsive controls

**React Flow advantages:**

- Built-in zoom/pan controls
- Node interaction out of the box
- Great performance with large graphs
- Mobile-friendly
- Custom node components (full React)
- Active community and examples

```

### Prompt 13: Reading View
```

Create the reading view component (app/story/[storyId]/read/[[...nodePath]]/page.tsx):

Requirements:

- Clean, distraction-free reading interface
- Typography optimized for long-form reading (appropriate font, line height, max-width)
- Show current chapter content
- Highlight each paragraph on hover with subtle border (indicates branchable points)
- When reaching a branch point, show BranchSelector component:
  - Display all available branches from this point
  - Show branch descriptions
  - Show branch stats (reads, rating)
  - Sort options: most popular, highest rated, newest, author's vision
  - "Select branch to continue" buttons
- Progress indicator showing:
  - Current position in story
  - Breadcrumb trail of path taken (clickable to go back)
  - Option to jump to tree view
- Floating action button for:
  - "Create branch from here" (if at paragraph level)
  - "Create continuation" (if at chapter end)
  - Bookmark this position
  - Share this path
- Previous/Next navigation (following current branch)
- Author attribution footer showing all contributors in current path

Use:

- NextUI for UI components
- Framer Motion for smooth transitions between chapters
- TanStack Query for data fetching with prefetching next chapter
- Zustand for managing reading state (current position, breadcrumbs)

Mobile optimized with bottom navigation.

```

### Prompt 14: Branch Selector Component
```

Create a BranchSelector component that displays when reader hits a branch point:

Props:

- parentNodeId: string
- branches: Array<{nodeId, authorId, description, stats}>
- onSelect: (nodeId) => void

UI:

- Modal or inline section (based on screen size)
- Title: "The story branches here - choose your path"
- Display each branch as a card:
  - Branch description (the contributor's pitch)
  - Author name with avatar
  - Stats: reads, upvotes/downvotes ratio
  - Badges if present (matches vision, author approved)
  - Preview button (shows first paragraph in popover)
  - "Continue with this branch" button
- Sort dropdown: Most popular, Highest rated, Newest, Author's vision, Random
- If 5+ branches: pagination or "show more"
- "View all paths in tree" link to visualization

Styling:

- Cards with hover effects
- Clear visual hierarchy
- Badges prominently displayed
- Author's vision branches highlighted with gold accent

Use Framer Motion for card entrance animations.

```

### Prompt 15: Branch Creation Form
```

Create branch creation page (app/story/[storyId]/branch/[nodeId]/page.tsx):

Show context:

- Display the parent node content (last few paragraphs)
- If branching mid-chapter, highlight the specific paragraph
- Show branch point visually

Form with validation:

1. Branch description (required, 50-200 chars)
   - Helper text: "Describe where your branch takes the story"
   - Character count
2. Chapter content (required, 500-10000 chars)
   - Rich text editor with:
     - Bold, italic formatting
     - Paragraph breaks
     - Paste from Word cleanup
   - Character/word count
   - Auto-save to localStorage every 30s
3. Preview mode toggle

Warnings/Info:

- "You can edit this for 1 hour after posting"
- "Branching from: [Author Name]'s Chapter X"
- "This will create a new storyline"

Actions:

- Save draft (localStorage)
- Preview (show formatted text)
- Submit branch
- Cancel (with unsaved changes warning)

After submission:

- Call createBranch GraphQL mutation
- Show success message
- Option to:
  - Continue writing (branch from your own branch)
  - Read your branch
  - Share your branch link
  - Return to tree view

Use react-hook-form with Zod validation.
Include loading states and error handling.

```

### Prompt 16: User Profile Page
```

Create user profile page (app/profile/[userId]/page.tsx):

Layout:
**Header Section:**

- Avatar (editable if own profile)
- Username
- Bio (editable if own profile)
- Stats grid:
  - Stories created
  - Branches contributed
  - Total upvotes received
  - Member since date
- Patreon supporter badge (if applicable)
- Follow/Message buttons (if viewing other's profile)

**Tabs:**

1. **Stories Created**
   - Grid of story cards they originated
   - Link to each story
2. **Branches Contributed**

   - List of all their branch contributions
   - Group by story
   - Show: story title, their branch description, stats, link to read

3. **Bookmarks** (only visible to self)

   - Stories they're currently reading
   - Shows current position
   - "Continue reading" CTA

4. **Contributions Graph** (GitHub-style)
   - Heat map of contribution activity
   - Shows writing frequency

Edit Profile (if own profile):

- Modal with form for username, bio, avatar upload
- Validation and character limits

Use NextUI Tabs, Card, Avatar components.
Responsive grid layout.

```

### Prompt 17: Search & Discovery
```

Create browse/search page (app/browse/page.tsx):

Features:
**Search Bar:**

- Full-text search across titles, synopses
- Search as you type with debounce
- Clear search button

**Filters (sidebar or top on mobile):**

- Genre (multi-select checkboxes)
- Completion status: Ongoing / Completed / Abandoned
- Branch count range slider
- Rating minimum (stars)
- Sort by:
  - Relevance (if searching)
  - Trending (most active last 7 days)
  - Newest
  - Most branches
  - Highest rated
  - Most reads

**Results Grid:**

- Story cards with all info
- Pagination or infinite scroll
- Show count: "Showing X of Y stories"
- Empty state if no results

**Saved Filters:**

- Allow users to save filter combinations
- Quick access to "My saved searches"

**Featured Collections:**

- Curated lists: "Staff Picks", "Best Sci-Fi", "Most Collaborative"

Mobile:

- Filters in drawer/modal
- Stack cards vertically

Use TanStack Query for data fetching with proper cache management.
URL state for filters (can share filtered URLs).

```

### Prompt 18: Authentication & Protected Routes
```

Set up AWS Amplify Auth integration:

**Auth Configuration:**

- Configure Amplify with Cognito User Pool
- Set up auth context provider
- Create useAuth hook for accessing user state

**Login Page (app/(auth)/login/page.tsx):**

- Email + password form
- "Remember me" checkbox
- "Forgot password" link
- Social login buttons (if configured)
- Link to signup
- Redirect to previous page after login

**Signup Page (app/(auth)/signup/page.tsx):**

- Email, username, password fields
- Password strength indicator
- Terms acceptance checkbox
- Email verification flow
- Redirect to onboarding/profile setup

**Protected Routes:**

- Middleware to check auth for:
  - /story/create
  - /story/[id]/branch/\*
  - /profile (own profile edit)
- Redirect to login with return URL

**User Menu (in navbar):**

- Avatar dropdown with:
  - View profile
  - My stories
  - Bookmarks
  - Settings
  - Logout

Use NextUI components for forms.
Handle loading and error states properly.

```

### ✅ PHASE 3 VERIFICATION - Frontend Integration Test
```

**STOP AND TEST before proceeding to Phase 4**

**1. Build and Compile Frontend:**

```bash
cd packages/the-story-hub/frontend

# Install dependencies
yarn install

# Run type checking
yarn tsc --noEmit

# Build the application
yarn build

# Expected: No TypeScript errors, successful build
```

**2. Run Frontend Locally:**

```bash
# Start dev server
yarn dev

# Should start on http://localhost:3000
```

**3. Test Amplify Configuration:**

**Create test file: frontend/src/**tests**/amplify.test.ts:**

```typescript
import { client } from "@/lib/amplify";
import { listStories } from "@/graphql/queries";

describe("Amplify GraphQL Client", () => {
  it("should be configured correctly", () => {
    expect(client).toBeDefined();
  });

  it("should have GraphQL endpoint configured", () => {
    expect(process.env.NEXT_PUBLIC_APPSYNC_URL).toBeDefined();
  });
});
```

**4. Test API Wrappers with Jest:**

**frontend/src/**tests**/api/stories.test.ts:**

```typescript
import { listStoriesAPI, getStoryAPI } from "@/lib/api/stories";

// Mock the GraphQL client
jest.mock("@/lib/amplify", () => ({
  client: {
    graphql: jest.fn(),
  },
}));

describe("Stories API", () => {
  it("should call listStories query", async () => {
    const mockData = {
      data: {
        listStories: {
          items: [{ storyId: "story-1", title: "Test Story" }],
          nextToken: null,
        },
      },
    };

    const { client } = require("@/lib/amplify");
    client.graphql.mockResolvedValue(mockData);

    const result = await listStoriesAPI({ featured: true }, 10);

    expect(client.graphql).toHaveBeenCalled();
    expect(result.items).toHaveLength(1);
    expect(result.items[0].title).toBe("Test Story");
  });
});
```

**Run frontend tests:**

```bash
yarn test

# Or with coverage
yarn test --coverage
```

**5. Manual End-to-End Testing:**

**Test Landing Page:**

- ✅ Visit http://localhost:3000
- ✅ See "The Enchanted Forest Chronicles" and "Cyberpunk Decisions" (seeded data)
- ✅ Click on a story card → navigates to story page
- ✅ Check browser console for no errors

**Test Story Page:**

- ✅ Visit http://localhost:3000/story/story-1
- ✅ See story title, synopsis, stats
- ✅ See tree visualization (if implemented)
- ✅ "Start Reading" button works

**Test Authentication:**

- ✅ Click "Login" → redirects to login page
- ✅ Enter test credentials
- ✅ Successfully logs in
- ✅ See user menu in navbar
- ✅ Can access protected routes

**Test Story Creation (Authenticated):**

- ✅ Navigate to /story/create
- ✅ Fill out form with valid data
- ✅ Submit → creates story in database
- ✅ Redirects to newly created story page
- ✅ Verify in DynamoDB that story exists

**6. Integration Test with Real Backend:**

**Install Playwright:**

```bash
yarn create playwright
# Select: TypeScript, tests folder, GitHub Actions workflow
```

**Create E2E test: tests/e2e/story-flow.spec.ts:**

```typescript
import { test, expect } from "@playwright/test";

test.describe("Story Creation Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Login as test user
    await page.goto("/login");
    await page.fill('[name="email"]', "testuser1@example.com");
    await page.fill('[name="password"]', "TestPass123!");
    await page.click('button[type="submit"]');

    // Wait for redirect
    await page.waitForURL("**/");
  });

  test("should create a new story", async ({ page }) => {
    await page.goto("/story/create");

    // Fill form
    await page.fill('[name="title"]', "My Test Story");
    await page.fill('[name="synopsis"]', "A".repeat(100)); // Min 50 chars
    await page.click('[name="genre"]');
    await page.click("text=Fantasy");
    await page.selectOption('[name="ageRating"]', "T");
    await page.fill(
      '[name="chapterContent"]',
      "Once upon a time...".repeat(50),
    );

    // Submit
    await page.click('button[type="submit"]');

    // Verify redirect
    await expect(page).toHaveURL(/\/story\//);
    await expect(page.locator("text=My Test Story")).toBeVisible();
  });

  test("should list stories on landing page", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.locator("text=The Enchanted Forest Chronicles"),
    ).toBeVisible();
    await expect(page.locator("text=Cyberpunk Decisions")).toBeVisible();
  });

  test("should read a story", async ({ page }) => {
    await page.goto("/story/story-1/read");

    await expect(
      page.locator("text=You step into the enchanted forest"),
    ).toBeVisible();
  });
});
```

**Run Playwright tests:**

```bash
# Interactive UI mode
yarn playwright test --ui

# Headless
yarn playwright test

# Headed (see browser)
yarn playwright test --headed

# Specific browser
yarn playwright test --project=chromium
yarn playwright test --project=firefox
yarn playwright test --project=webkit
```

**7. Network Request Verification:**

- Open browser DevTools → Network tab
- Visit landing page
- ✅ Verify GraphQL request to AppSync API
- ✅ Check request headers include auth token (when logged in)
- ✅ Verify response contains story data
- ✅ No 401/403 errors

**8. Performance Check:**

```bash
# Install Lighthouse CLI
npm install -g lighthouse

# Run Lighthouse audit
lighthouse http://localhost:3000 --view

# Check metrics:
# - Performance score > 80
# - Accessibility score > 90
# - Best Practices score > 90
```

**9. Component Testing with React Testing Library:**

**frontend/src/**tests**/components/StoryCard.test.tsx:**

```typescript
import { render, screen } from '@testing-library/react';
import StoryCard from '@/components/StoryCard';

describe('StoryCard', () => {
  const mockStory = {
    storyId: 'story-1',
    title: 'Test Story',
    authorId: 'user-1',
    synopsis: 'A test synopsis',
    genre: ['Fantasy'],
    ageRating: 'T',
    stats: {
      totalBranches: 10,
      totalReads: 100,
      rating: 4.5,
    },
  };

  it('renders story information correctly', () => {
    render(<StoryCard story={mockStory} />);

    expect(screen.getByText('Test Story')).toBeInTheDocument();
    expect(screen.getByText('A test synopsis')).toBeInTheDocument();
    expect(screen.getByText(/10.*branches/i)).toBeInTheDocument();
    expect(screen.getByText(/100.*reads/i)).toBeInTheDocument();
  });

  it('shows age rating badge', () => {
    render(<StoryCard story={mockStory} />);

    expect(screen.getByText('T')).toBeInTheDocument();
  });
});
```

**Expected Results:**
✅ Frontend builds without errors
✅ Dev server runs without errors
✅ All Jest unit tests pass
✅ API wrappers correctly call GraphQL client
✅ Landing page displays seeded stories
✅ Authentication flow works end-to-end
✅ Story creation creates records in DynamoDB
✅ Playwright E2E tests pass (all browsers)
✅ Network requests show valid GraphQL calls
✅ Lighthouse performance score > 80
✅ Component tests pass

**Common Issues:**

- ❌ "Module not found: gqlTypes" → Run `yarn build-gql`
- ❌ "Network error" → Check .env.local has correct APPSYNC_URL
- ❌ "Unauthorized" → Verify Cognito credentials
- ❌ "CORS error" → Check AppSync CORS configuration
- ❌ Hydration errors → Check server/client rendering consistency

**Debug Commands:**

```bash
# Check environment variables
yarn env | grep NEXT_PUBLIC

# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules && yarn install

# Check GraphQL types are generated
cat src/types/gqlTypes.ts | grep "export type Story"
```

**If all tests pass, proceed to Phase 4!**

```

---

## Phase 4: Polish & Features

### Prompt 19: Notifications System
```

Build in-app notifications system:

**Notification Component (in navbar):**

- Bell icon with unread count badge
- Dropdown showing recent notifications
- Types of notifications:
  - Someone branched from your contribution
  - Your branch got upvoted
  - Someone replied to your branch (future feature)
  - Story author marked your branch "matches vision"
  - New branch on story you're following

**Notification Item:**

- Icon based on type
- Message text
- Time ago
- Link to relevant content
- Mark as read/unread
- Delete option

**Notification Settings Page:**

- Email notification preferences
- Push notification opt-in (future)
- Frequency settings (instant, daily digest, weekly)

**Backend Integration:**

- Poll listNotifications GraphQL query every X seconds when active
- AppSync Real-Time Subscriptions for instant updates (use GraphQL subscriptions)
- Subscribe to: onNewNotification(userId: ID!)

**Notification Center Page:**

- Full list of all notifications
- Filter by type
- Mark all as read
- Pagination

Use Zustand for notification state management.
Show toast for new notifications while user is active.

```

### Prompt 20: Responsive Design & Mobile Optimization
```

Ensure the entire platform is fully responsive and mobile-optimized:

**Breakpoints:**

- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

**Mobile-Specific Adaptations:**

1. **Navigation:**

   - Hamburger menu instead of full nav
   - Bottom tab bar for main sections
   - Sticky header with search

2. **Tree Visualization:**

   - Switch to vertical list/timeline view
   - Collapsible branches
   - Simplified stats display

3. **Reading View:**

   - Full-width content (no sidebars)
   - Floating action button for branch creation
   - Swipe gestures for prev/next chapter
   - Bottom sheet for branch selection

4. **Forms:**

   - Stack inputs vertically
   - Larger touch targets (min 44px)
   - Native keyboard support

5. **Cards/Grids:**
   - Single column on mobile
   - 2 columns on tablet
   - 3-4 columns on desktop

**Performance:**

- Lazy load images
- Virtualize long lists
- Code splitting by route
- Optimize bundle size

**Touch Interactions:**

- Swipe to navigate chapters
- Pull to refresh on lists
- Long-press for context menus

Test on real devices and use Chrome DevTools mobile emulation.

```

### Prompt 21: Analytics & Monitoring
```

Add analytics and monitoring using Sentry (already in dependencies):

**Frontend (Sentry):**

- Initialize Sentry in app/layout.tsx
- Track errors and performance
- Custom events:
  - Story created
  - Branch created
  - Chapter read
  - User signed up
  - Search performed

**Backend (CloudWatch + Sentry):**

- Lambda function logging
- Custom metrics:
  - API latency
  - Error rates by endpoint
  - DynamoDB read/write units
  - S3 storage usage
- Alarms for:
  - High error rates
  - Slow API responses
  - Failed Lambda executions

**User Analytics:**

- Track without PII:
  - Popular stories
  - Most branched points
  - Average reading time
  - User retention
  - Feature usage

**Dashboard Page (admin only):**

- Display key metrics
- Charts using Recharts or similar
- Real-time stats
- User growth
- Content growth (stories, branches per day)

Respect privacy - make analytics opt-out in settings.

```

### Prompt 22: Admin Features
```

Create admin dashboard and moderation tools:

**Admin Dashboard (app/admin/page.tsx):**

- Only accessible to admin users (check Cognito groups)
- Key metrics:
  - Total users, stories, branches
  - Growth charts
  - Active users (DAU/MAU)
  - Storage usage
  - API costs estimate

**Content Moderation:**

- Flagged content queue
- User reports
- Quick actions:
  - Hide/unhide content
  - Delete spam
  - Ban user
  - Feature story

**Story Management:**

- Mark stories as featured
- Edit any story (with audit log)
- Bulk operations

**User Management:**

- View all users
- Search by email/username
- Grant/revoke admin
- Mark as Patreon supporter
- View user activity

**System Settings:**

- Toggle features on/off
- Set announcement banner
- Update featured collections
- Manage genre list

Add audit logging for all admin actions to DynamoDB.

```

### Prompt 23: Testing & Documentation
```

Set up testing infrastructure and documentation:

**Testing:**

1. **Backend Unit Tests (Jest):**

   - Test AppSync resolvers (request/response functions)
   - Test Lambda handlers
   - Mock DynamoDB calls
   - Test business logic
   - Target 80%+ coverage

2. **Frontend Unit Tests (Jest + React Testing Library):**

   - Test components in isolation
   - Test hooks
   - Test utility functions
   - Mock API calls

3. **Integration Tests:**

   - Test GraphQL API endpoints end-to-end
   - Test auth flows (Cognito)
   - Test data persistence (DynamoDB)

4. **E2E Tests (Playwright):**
   **Install Playwright:**

   ```bash
   yarn create playwright
   # Select: TypeScript, tests folder, GitHub Actions workflow
   ```

   **Configure playwright.config.ts for multi-browser testing:**

   ```typescript
   import { defineConfig, devices } from "@playwright/test";

   export default defineConfig({
     testDir: "./tests/e2e",
     fullyParallel: true,
     forbidOnly: !!process.env.CI,
     retries: process.env.CI ? 2 : 0,
     workers: process.env.CI ? 1 : undefined,
     reporter: "html",
     use: {
       baseURL: "http://localhost:3000",
       trace: "on-first-retry",
     },
     projects: [
       {
         name: "chromium",
         use: { ...devices["Desktop Chrome"] },
       },
       {
         name: "firefox",
         use: { ...devices["Desktop Firefox"] },
       },
       {
         name: "webkit",
         use: { ...devices["Desktop Safari"] },
       },
       {
         name: "mobile",
         use: { ...devices["iPhone 13"] },
       },
     ],
   });
   ```

   **Critical user flows to test:**

   - Sign up → Create story → Read → Branch
   - Search → Read → Bookmark
   - User profile journey
   - Admin moderation flows
   - Age-gated content access

**Documentation:**

1. **README.md:**

   - Project overview
   - Setup instructions
   - Environment variables
   - Development workflow
   - Deployment process

2. **API Documentation:**

   - OpenAPI/Swagger spec
   - All endpoints documented
   - Request/response examples
   - Error codes

3. **Contributing Guide:**

   - Code style
   - Git workflow
   - PR process
   - Testing requirements

4. **User Guide (in-app):**

   - How to create stories
   - How to branch
   - How to navigate trees
   - FAQ section

5. **Architecture Documentation:**
   - System design
   - Data flow diagrams
   - Infrastructure diagram
   - Tech stack decisions

```

### Prompt 24: Deployment & CI/CD
```

Set up deployment pipeline:

**Development Environment:**

- Local development with:
  - AWS SAM CLI for Lambda testing
  - DynamoDB Local
  - S3 Local (LocalStack)
- Environment variables in .env.local

**Staging Environment:**

- Separate AWS account or isolated resources
- Deploy on every merge to `develop` branch
- Run integration tests
- Test data seeding

**Production Environment:**

- Deploy on merge to `main` branch
- Blue-green deployment for zero downtime
- Automated rollback on errors

**GitHub Actions (or similar CI/CD):**

1. **On PR:**

   - Run linter (ESLint)
   - Run tests
   - Build check
   - Type check

2. **On merge to develop:**

   - Deploy to staging
   - Run E2E tests
   - Notify team

3. **On merge to main:**
   - Deploy backend (Lambda + CloudFormation)
   - Deploy frontend (Next.js to Vercel/Amplify)
   - Run smoke tests
   - Update CloudFront invalidation
   - Notify team

**Monitoring Post-Deployment:**

- Check error rates spike
- Verify health checks pass
- Monitor performance metrics

**Rollback Plan:**

- Keep last 3 versions
- One-click rollback script
- Database migration reversibility

Create deployment scripts and document the process.

```

### Prompt 25: Performance Optimization
```

Optimize platform performance:

**Frontend Optimization:**

1. **Code Splitting:**

   - Route-based splitting (already handled by Next.js)
   - Component lazy loading for heavy components (tree viz, editor)
   - Dynamic imports for modals and drawers

2. **Image Optimization:**

   - Use Next.js Image component
   - Serve WebP with fallbacks
   - Lazy load images below fold
   - Responsive images (srcset)

3. **Data Fetching:**

   - Implement proper caching with TanStack Query
   - Prefetch next chapter while reading
   - Optimistic updates for votes/bookmarks
   - Pagination for long lists

4. **Bundle Size:**

   - Analyze with Next.js bundle analyzer
   - Tree-shake unused code
   - Use lighter alternatives where possible
   - Dynamic import heavy dependencies (React Flow, Recharts)

5. **Rendering:**
   - Use React.memo for expensive components
   - Virtualize long lists (react-window)
   - Debounce search inputs
   - Throttle scroll events

**Backend Optimization:**

1. **DynamoDB:**

   - Use query instead of scan
   - Implement proper indexes
   - Batch operations where possible
   - Use DynamoDB Streams for async updates

2. **Lambda:**

   - Optimize cold starts (minimize dependencies)
   - Increase memory if needed
   - Use Lambda layers for shared code
   - Connection pooling for external services

3. **Caching:**

   - CloudFront for static assets and frontend
   - AppSync caching for GraphQL queries (configure TTL)
   - In-memory caching in Lambda functions (global scope)
   - DynamoDB DAX for read-heavy operations (optional)

4. **API Design:**
   - Return only needed fields
   - Pagination for lists
   - Compression (gzip)

**Monitoring:**

- Set up Lighthouse CI
- Track Core Web Vitals
- Monitor Time to Interactive
- Set performance budgets

Create performance testing suite and run regularly.

````

---

## Phase 4 Verification: Polish & Production Readiness

**STOP AND TEST before proceeding to Phase 5**

Before launching to production, verify all polish features and optimizations are working correctly.

### 1. Notifications System Testing

**Test Real-Time Subscriptions:**
```bash
# In AppSync Console, test subscription
subscription OnNewNotification {
  onNewNotification(userId: "test-user-1") {
    notificationId
    type
    message
    link
    read
    createdAt
  }
}

# Then trigger a notification (upvote, branch, etc.) and verify it appears in real-time
````

**Test Notification Queries:**

```bash
# Test notification listing
query ListNotifications {
  listNotifications(limit: 20) {
    items {
      notificationId
      type
      message
      read
    }
    nextToken
  }
}

# Test mark as read mutation
mutation MarkNotificationRead {
  markNotificationRead(notificationId: "notif-123") {
    notificationId
    read
  }
}
```

**Frontend Notification Tests:**

```typescript
// tests/components/NotificationBell.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { NotificationBell } from '@/components/NotificationBell';

describe('NotificationBell', () => {
  it('should display unread count badge', () => {
    render(<NotificationBell unreadCount={5} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('should fetch notifications on click', async () => {
    render(<NotificationBell />);
    const bell = screen.getByRole('button');
    bell.click();
    await waitFor(() => {
      expect(screen.getByText(/branch got upvoted/i)).toBeInTheDocument();
    });
  });
});
```

### 2. Responsive Design Verification

**Test All Breakpoints:**

```bash
# Configure playwright.config.ts with multiple devices
# Then run tests across all viewports
npx playwright test --project=mobile
npx playwright test --project=tablet
npx playwright test --project=desktop
```

**playwright.config.ts device configuration:**

```typescript
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  projects: [
    {
      name: "mobile",
      use: { ...devices["iPhone 13"] },
    },
    {
      name: "tablet",
      use: { ...devices["iPad Pro"] },
    },
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
```

**Mobile-Specific E2E Tests:**

```typescript
// tests/e2e/mobile-navigation.spec.ts
import { test, expect, devices } from "@playwright/test";

test.use(devices["iPhone 13"]);

test.describe("Mobile Navigation", () => {
  test("should show hamburger menu on mobile", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator('[data-testid="hamburger-menu"]')).toBeVisible();
    await expect(page.locator('[data-testid="desktop-nav"]')).not.toBeVisible();
  });

  test("should navigate story tree with swipe gestures", async ({ page }) => {
    await page.goto("/story/story-1/read");

    // Simulate swipe
    await page
      .locator('[data-testid="chapter-content"]')
      .dispatchEvent("swiperight");
    await expect(page).toHaveURL(/\/previous/);
  });

  test("should switch to list view on mobile tree viz", async ({ page }) => {
    await page.goto("/story/story-1/tree");

    await page.click('[data-testid="tree-view-toggle"]');
    await expect(
      page.locator('[data-testid="timeline-list-view"]'),
    ).toBeVisible();
  });
});
```

**Visual Regression Testing:**

```bash
# Playwright has built-in screenshot comparison
# Or use Percy/Chromatic for visual testing
npm install --save-dev @playwright/test

# Use Playwright's built-in visual comparison
npx playwright test --update-snapshots  # Update baseline screenshots
npx playwright test                      # Compare against baselines
```

**tests/e2e/visual-regression.spec.ts:**

```typescript
import { test, expect, devices } from "@playwright/test";

test("captures story card on mobile", async ({ page }) => {
  await page.goto("/browse", {
    ...devices["iPhone 13"],
  });

  await expect(page).toHaveScreenshot("story-card-mobile.png");
});

test("captures tree visualization on tablet", async ({ page }) => {
  await page.goto("/story/story-1/tree", {
    ...devices["iPad Pro"],
  });

  await expect(page).toHaveScreenshot("tree-view-tablet.png");
});
```

**Or use Percy with Playwright:**

```bash
npm install --save-dev @percy/playwright

# tests/e2e/visual-percy.spec.ts
import { test } from '@playwright/test';
import percySnapshot from '@percy/playwright';

test('visual regression with Percy', async ({ page }) => {
  await page.goto('/browse');
  await percySnapshot(page, 'Story Browse Page');
});
```

### 3. Analytics & Monitoring Verification

**Verify Sentry Integration:**

```typescript
// Test error tracking
// pages/api/test-error.ts (remove after testing)
export default function handler(req, res) {
  throw new Error("Test Sentry error tracking");
}

// Visit /api/test-error and verify error appears in Sentry dashboard
```

**Test Custom Events:**

```typescript
// lib/analytics.ts
import * as Sentry from "@sentry/nextjs";

export function trackStoryCreated(storyId: string) {
  Sentry.addBreadcrumb({
    category: "story",
    message: "Story created",
    data: { storyId },
    level: "info",
  });
}

// Verify events appear in Sentry dashboard
```

**CloudWatch Metrics Testing:**

```bash
# Check Lambda logs
aws logs tail /aws/lambda/TheStoryHub-ImageProcessor --follow

# Query custom metrics
aws cloudwatch get-metric-statistics \
  --namespace TheStoryHub \
  --metric-name APILatency \
  --start-time 2025-01-01T00:00:00Z \
  --end-time 2025-01-02T00:00:00Z \
  --period 3600 \
  --statistics Average

# Verify alarms are configured
aws cloudwatch describe-alarms --alarm-names TheStoryHub-HighErrorRate
```

### 4. Admin Features Testing

**Test Admin Dashboard Access Control:**

```typescript
// tests/e2e/admin.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Admin Dashboard", () => {
  test("should deny access to non-admin users", async ({ page }) => {
    // Login as regular user
    await page.goto("/login");
    await page.fill('[name="email"]', "regular-user@example.com");
    await page.fill('[name="password"]', "password123");
    await page.click('button[type="submit"]');

    await page.goto("/admin");
    await expect(page).toHaveURL(/\/unauthorized/);
  });

  test("should allow access to admin users", async ({ page }) => {
    // Login as admin
    await page.goto("/login");
    await page.fill('[name="email"]', "admin@example.com");
    await page.fill('[name="password"]', "admin123");
    await page.click('button[type="submit"]');

    await page.goto("/admin");
    await expect(page.locator('[data-testid="admin-dashboard"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-count"]')).toBeVisible();
  });
});
```

**Test Content Moderation:**

```typescript
test.describe("Content Moderation", () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto("/login");
    await page.fill('[name="email"]', "admin@example.com");
    await page.fill('[name="password"]', "admin123");
    await page.click('button[type="submit"]');
  });

  test("should hide flagged content", async ({ page }) => {
    await page.goto("/admin/moderation");

    const flaggedItem = page.locator('[data-testid="flagged-item-1"]');
    await flaggedItem.locator('[data-testid="hide-button"]').click();

    await expect(
      page.locator("text=Content hidden successfully"),
    ).toBeVisible();
  });

  test("should feature stories", async ({ page }) => {
    await page.goto("/admin/stories");

    const story = page.locator('[data-testid="story-story-1"]');
    await story.locator('[data-testid="feature-toggle"]').click();

    await page.goto("/");
    await expect(
      page.locator('[data-testid="featured-stories"]'),
    ).toContainText("Story Title");
  });
});
```

### 5. Performance Testing

**Lighthouse CI Testing:**

```bash
# Install Lighthouse CI
npm install -g @lhci/cli

# Create lighthouserc.json
cat > lighthouserc.json << 'EOF'
{
  "ci": {
    "collect": {
      "url": ["http://localhost:3000", "http://localhost:3000/browse", "http://localhost:3000/story/story-1"],
      "numberOfRuns": 3
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", {"minScore": 0.9}],
        "categories:accessibility": ["error", {"minScore": 0.9}],
        "categories:best-practices": ["error", {"minScore": 0.9}],
        "categories:seo": ["error", {"minScore": 0.9}]
      }
    }
  }
}
EOF

# Run Lighthouse CI
lhci autorun

# Expected Results:
# ✅ Performance score > 90
# ✅ Accessibility score > 90
# ✅ Best Practices score > 90
# ✅ SEO score > 90
```

**Load Testing with Artillery:**

```bash
# Install Artillery
npm install -g artillery

# Create load test config
cat > artillery-config.yml << 'EOF'
config:
  target: 'https://api.thestoryhub.example.com/graphql'
  phases:
    - duration: 60
      arrivalRate: 10
      name: Warm up
    - duration: 120
      arrivalRate: 50
      name: Sustained load
    - duration: 60
      arrivalRate: 100
      name: Spike test
  processor: "./artillery-helpers.js"
scenarios:
  - name: Browse and read stories
    flow:
      - post:
          url: "/"
          json:
            query: "query ListStories { listStories(limit: 20) { items { storyId title } } }"
      - think: 2
      - post:
          url: "/"
          json:
            query: "query GetStory($storyId: ID!) { getStory(storyId: $storyId) { title chapters { content } } }"
            variables:
              storyId: "{{ $randomString() }}"
EOF

# Run load test
artillery run artillery-config.yml

# Expected Results:
# ✅ p95 latency < 500ms
# ✅ p99 latency < 1000ms
# ✅ Error rate < 1%
# ✅ No memory leaks
```

**Bundle Size Analysis:**

```bash
# Analyze bundle size
ANALYZE=true yarn build

# Check bundle sizes
ls -lh .next/static/chunks/*.js

# Expected Results:
# ✅ Main bundle < 200KB gzipped
# ✅ Individual route chunks < 100KB
# ✅ No duplicate dependencies
# ✅ Tree visualization (React Flow) loaded dynamically
```

### 6. Deployment Pipeline Testing

**Test CI/CD Pipeline:**

```bash
# Create a test branch and PR
git checkout -b test/ci-cd-verification
echo "# Test" >> README.md
git add README.md
git commit -m "test: verify CI/CD pipeline"
git push origin test/ci-cd-verification

# Expected CI checks:
# ✅ ESLint passes
# ✅ TypeScript compilation succeeds
# ✅ All tests pass
# ✅ Build succeeds
# ✅ No security vulnerabilities
```

**Verify Staging Deployment:**

```bash
# Deploy to staging
yarn deploy:staging

# Smoke test staging environment
curl -I https://staging.thestoryhub.example.com
# Should return 200 OK

# Test GraphQL API
curl -X POST https://staging-api.thestoryhub.example.com/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __schema { queryType { name } } }"}'

# Expected Results:
# ✅ Frontend accessible
# ✅ API responding
# ✅ Authentication working
# ✅ Database connected
```

### 7. Integration Testing Checklist

**Complete User Flows:**

```typescript
// tests/e2e/complete-user-journey.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Complete User Journey", () => {
  test("should complete full user lifecycle", async ({ page }) => {
    // Sign up
    await page.goto("/signup");
    await page.fill('[name="email"]', "newuser@example.com");
    await page.fill('[name="password"]', "SecurePass123!");
    await page.click('[type="submit"]');

    // Verify email (mock)
    await expect(page.locator("text=Check your email")).toBeVisible();

    // Create story
    await page.goto("/story/create");
    await page.fill('[name="title"]', "My First Story");
    await page.fill(
      '[name="synopsis"]',
      "This is a test story synopsis that is at least 50 characters long to meet requirements.",
    );
    await page.selectOption('[name="genre"]', "Fantasy");
    await page.selectOption('[name="ageRating"]', "T");
    await page.fill(
      '[name="chapterContent"]',
      "Chapter 1 content goes here. ".repeat(50),
    );
    await page.click('[type="submit"]');

    // Verify story created
    await expect(page).toHaveURL(/\/story\//);
    await expect(page.locator("text=My First Story")).toBeVisible();

    // Read and branch
    await page.click('[data-testid="read-button"]');
    await page.click('[data-testid="paragraph-3"]');
    await page.click('[data-testid="create-branch"]');
    await page.fill('[name="branchDescription"]', "An alternative path");
    await page.fill(
      '[name="content"]',
      "Alternative content here. ".repeat(50),
    );
    await page.click('[type="submit"]');

    // Verify branch created
    await expect(
      page.locator("text=Branch created successfully"),
    ).toBeVisible();

    // View tree
    await page.click('[data-testid="tree-view-button"]');
    await expect(
      page.locator('[data-testid="tree-visualization"]'),
    ).toBeVisible();

    // Bookmark story
    await page.click('[data-testid="bookmark-button"]');
    await expect(page.locator("text=Bookmarked")).toBeVisible();

    // Check profile
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="profile-link"]');
    await expect(page.locator("text=Stories Created: 1")).toBeVisible();
    await expect(page.locator("text=Branches Contributed: 1")).toBeVisible();
  });
});
```

### 8. Manual Testing Checklist

Before proceeding to Phase 5, manually verify:

**Notifications:**

- [ ] Real-time notifications appear without refresh
- [ ] Notification bell shows correct unread count
- [ ] Mark as read works correctly
- [ ] Notification settings save properly
- [ ] Email notifications sent (if enabled)

**Responsive Design:**

- [ ] Mobile navigation works smoothly
- [ ] Tree visualization adapts to mobile (list/timeline view)
- [ ] Forms are usable on small screens
- [ ] Touch targets are at least 44px
- [ ] Reading view comfortable on all devices
- [ ] No horizontal scrolling on mobile

**Analytics:**

- [ ] Sentry captures errors correctly
- [ ] Custom events tracked
- [ ] CloudWatch shows Lambda metrics
- [ ] Admin dashboard displays real data
- [ ] User analytics opt-out works

**Admin Features:**

- [ ] Admin access restricted to admin users
- [ ] Content moderation queue works
- [ ] Feature story toggle works
- [ ] User management functions work
- [ ] Audit log records admin actions

**Performance:**

- [ ] Lighthouse scores > 90 in all categories
- [ ] Page load time < 3 seconds
- [ ] Tree renders with 100+ nodes smoothly
- [ ] Image loading optimized
- [ ] No memory leaks during navigation

**Deployment:**

- [ ] CI/CD pipeline runs on PR
- [ ] Staging deployment successful
- [ ] Environment variables configured
- [ ] Rollback process tested
- [ ] Monitoring dashboards set up

### 9. Security Testing

**Security Checklist:**

```bash
# Run security audit
npm audit

# Check for vulnerabilities
npm audit fix

# Test authentication
curl -X POST https://api.thestoryhub.example.com/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ listStories { items { title } } }"}' \
  # Should return 401 Unauthorized without auth token

# Test authorization
# As regular user, try to access admin mutation
# Should be denied

# Test rate limiting
for i in {1..100}; do
  curl -X POST https://api.thestoryhub.example.com/graphql &
done
# Should trigger rate limiting after threshold
```

**Expected Security Results:**

- ✅ No critical npm vulnerabilities
- ✅ Authentication required for protected routes
- ✅ Authorization enforced (users can't modify others' content)
- ✅ Rate limiting prevents abuse
- ✅ CORS configured correctly
- ✅ HTTPS enforced
- ✅ Sensitive data encrypted

### 10. Troubleshooting Guide

**Common Issues:**

1. **Notifications not appearing in real-time:**

   - Check WebSocket connection in browser DevTools
   - Verify AppSync subscription configuration
   - Check Cognito auth token validity

2. **Mobile layout breaking:**

   - Verify Tailwind breakpoints
   - Check for fixed widths instead of responsive units
   - Test on real devices, not just emulator

3. **Performance issues:**

   - Check bundle size with analyzer
   - Verify lazy loading configured
   - Check for unnecessary re-renders (React DevTools Profiler)
   - Review TanStack Query cache configuration

4. **Admin features not accessible:**
   - Verify user is in Cognito admin group
   - Check AppSync resolver authorization logic
   - Review CloudWatch logs for errors

---

**If all Phase 4 tests pass, proceed to Phase 5!**

---

## Phase 5: Launch Preparation

### Prompt 26: Beta Testing & Feedback Loop

```
Prepare for beta launch:

**Beta Program Setup:**
1. Create invite system:
   - Generate invite codes
   - Track invites used
   - Limit initial users (100-500)

2. Onboarding for beta users:
   - Welcome email with guide
   - In-app tutorial/walkthrough
   - Links to feedback form
   - Discord/Slack community invite

3. Feedback Collection:
   - In-app feedback button (always visible)
   - Survey after first story created
   - Survey after first branch created
   - Bug report form with screenshots
   - Feature request upvoting

4. Beta Dashboard:
   - Track engagement metrics
   - Monitor what features are used
   - Identify pain points
   - Track completion rates

**Testing Focus Areas:**
- Story creation flow
- Reading experience
- Branching mechanics
- Tree visualization usability
- Mobile experience
- Search and discovery

**Iteration Process:**
- Weekly feedback review
- Prioritize critical bugs
- Quick wins for UX improvements
- Communicate updates to beta users

Create a beta tester leaderboard to gamify participation.
```

### Prompt 26.5: Age Rating & Content Warnings

````
Implement age rating and content warning system:

**Age Rating System:**

1. **Rating Levels:**
   - General (G): Suitable for all ages
   - Teen (T): Ages 13+, mild language/themes
   - Mature (M): Ages 16+, strong language, violence, suggestive themes
   - Adult (18+): Ages 18+, explicit sexual content, graphic violence, strong mature themes

2. **Story Creation:**
   - Author must select age rating during story creation
   - Cannot be changed to lower rating once set (only higher)
   - Clear descriptions of what each rating means
   - Examples provided for each category
   - Warning about choosing appropriate rating

3. **Branch Rating:**
   - Branches inherit parent story's rating by default
   - Contributors can flag if their branch should increase rating
   - Original author reviews and approves rating increase
   - If branch is more mature than story rating, story rating increases
   - Notification to original author when rating flagged

4. **Age Verification:**
   - Users must confirm age during signup
   - 18+ content gated behind age verification
   - Date of birth stored (encrypted)
   - Re-verification if suspicious activity

**Content Warning Tags:**

In addition to age rating, authors can add specific content warnings:
- Sexual Content (with intensity level)
- Violence/Gore
- Death
- Self-Harm/Suicide
- Abuse (physical, sexual, emotional)
- Drug/Alcohol Use
- Strong Language
- Horror/Disturbing Content
- Trauma/PTSD triggers
- Other (custom text)

**UI Implementation:**

1. **Story Page:**
   - Age rating badge prominently displayed
   - Content warning tags below rating
   - "Why this rating?" expandable explanation
   - Option to hide content warnings (but show count)
   - Content warning tags below rating
   - "Why this rating?" expandable explanation
   - Option to hide content warnings (but show count)

2. **Reading View:**
   - Warning screen before entering 18+ content
   - "I am 18+ and consent to view mature content" checkbox
   - Remember preference per session
   - Chapter-level warnings if specific chapter is intense

3. **Browse/Search:**
   - Filter by age rating
   - Hide 18+ content by default (opt-in to view)
   - Content warning filters
   - Safe mode toggle in user settings
   - Hide 18+ content by default (opt-in)
   - Content warning filters
   - Safe mode toggle in user settings

4. **Branch Creation:**
   - Prompt: "Does your branch contain mature content?"
   - Checkbox: "My branch should increase the story's age rating"
   - If checked, explain why and suggest new rating
   - Checklist of content warnings if applicable
   - Preview shows rating and warnings
   - Confirmation if increasing story rating
   - Checklist of content warnings
   - Preview shows rating and warnings
   - Confirmation if increasing story rating

**User Settings:**

- Content Preferences:
  - Hide 18+ content (default for unverified users)
  - Hide specific content warnings
  - Blur 18+ story covers
  - Email digest excludes mature content (optional)
- Age verification status
- Safe mode toggle

**Moderation:**

- Reports trigger rating review
- Moderators can adjust ratings
- Authors warned if consistently mis-rating
- Repeat offenders have posting restricted

**Legal Compliance:**

- Terms of Service includes age requirements
- COPPA compliance (no users under 13)
- Different requirements by jurisdiction
- Clear liability disclaimers

**Data Schema Addition:**

```typescript
type Story = {
  // ... existing fields
  ageRating: 'G' | 'T' | 'M' | '18+';
  contentWarnings: string[]; // array of warning tags
  ratingExplanation?: string; // why this rating
  ratingLastUpdated: string;
  ratingHistory: Array<{
    oldRating: string;
    newRating: string;
    reason: string;
    updatedAt: string;
  }>;
};

type ChapterNode = {
  // ... existing fields
  ratingFlags?: {
    flaggedBy: string; // userId who flagged
    suggestedRating: string;
    reason: string;
    status: 'pending' | 'approved' | 'rejected';
  };
};
````

Create clear rating guidelines document with examples.

```

### Prompt 27: Content Moderation & Safety
```

Implement content moderation and safety features:

**Automated Moderation:**

1. Content filters:

   - Profanity filter (with severity levels)
   - Spam detection (repeated content, links)
   - NSFW content detection (flag for age rating review)

2. Rate limiting:

   - Max stories per user per day (prevent spam)
   - Max branches per user per hour
   - Max edits in timeframe

3. Suspicious activity detection:
   - Multiple accounts from same IP
   - Rapid content creation
   - Mass upvoting patterns

**User Reporting:**

- Report buttons on stories and branches
- Report reasons:
  - Spam
  - Harassment
  - Copyright violation
  - Inappropriate age rating (content is more mature than marked)
  - Missing content warnings
  - Other (with description)
- Report queue for moderators

**Moderation Tools:**

- Review queue with priority sorting
- Quick actions: approve, hide, delete, ban, adjust age rating
- Notes and communication with reporters
- Appeal process for content removal

**Community Guidelines:**

- Clear rules page
- Examples of acceptable/unacceptable content
- Consequences for violations
- Display during signup
- Specific section on age ratings and content warnings

**Age Rating Moderation:**

- Queue for flagged rating increases
- Review reported mis-ratings
- Automatic detection of mature keywords without 18+ rating
- Warning system for authors who consistently mis-rate
- Tools to quickly scan through content

**User Safety:**

- Block user feature
- Private profiles option (future)
- Content warnings system ✅
- Age verification ✅
- Parental controls (future)

**Legal Compliance:**

- DMCA takedown process
- Copyright infringement reporting
- Terms of Service (including age requirements)
- Privacy Policy
- GDPR compliance (data export/deletion)
- COPPA compliance (no users under 13)
- Age-restricted content regulations by jurisdiction

Consult with legal counsel before launch, especially regarding age-gated content.

```

### Prompt 28: Patreon Integration & Monetization
```

Implement Patreon integration and supporter features:

**Patreon OAuth Integration:**

1. Patreon app setup
2. OAuth flow:
   - Connect Patreon account button in profile
   - Redirect to Patreon for authorization
   - Receive webhook for pledge status
   - Store supporter status in User table

**Supporter Benefits:**

- Ad-free experience
- Supporter badge on profile and contributions
- Featured supporter section
- Early access to new features
- Increased upload limits
- Custom profile themes
- Priority support

**Webhook Handling:**

- Listen for pledge events:
  - New pledge
  - Updated pledge
  - Deleted pledge
- Update user supporter status
- Send welcome email to new supporters

**Alternative Monetization (Phase 2):**

1. Non-intrusive ads for free users:

   - Between chapters (natural pause point)
   - On browse pages (sidebar/bottom)
   - Branch selection screens
   - Never mid-paragraph or disruptive

2. Tipping System:

   - Readers can tip story authors
   - Readers can tip branch contributors
   - Platform takes 10-15% fee
   - Stripe integration for payments
   - Monthly payout system

3. Premium Features (future):
   - Advanced analytics for authors
   - Export story to PDF/EPUB
   - Custom domains for author pages
   - Collaboration tools (co-writing)

**Donation Campaigns:**

- Wikipedia-style banner (1-2x per year)
- Show funding goal and progress
- Transparency about costs
- Supporter wall of fame

Create clear pricing page explaining all tiers and features.

````

---

## Phase 5 Verification: Launch Readiness

**STOP AND TEST before proceeding to Phase 6**

Before launching to beta users and then production, verify all launch preparation features are complete and working.

### 1. Beta Program Testing

**Test Invite System:**
```typescript
// tests/e2e/beta-invites.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Beta Invite System', () => {
  test('should generate and validate invite codes', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('[name="email"]', 'admin@example.com');
    await page.fill('[name="password"]', 'admin123');
    await page.click('button[type="submit"]');

    await page.goto('/admin/beta-invites');

    // Generate invite code
    await page.click('[data-testid="generate-invite"]');
    const inviteCode = await page.locator('[data-testid="invite-code"]').textContent();

    // Use invite code for signup
    await page.goto('/signup');
    await page.fill('[name="inviteCode"]', inviteCode!);
    await page.fill('[name="email"]', 'beta-user@example.com');
    await page.fill('[name="password"]', 'SecurePass123!');
    await page.click('[type="submit"]');

    await expect(page.locator('text=Welcome to the beta!')).toBeVisible();
  });

  test('should enforce beta user limits', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('[name="email"]', 'admin@example.com');
    await page.fill('[name="password"]', 'admin123');
    await page.click('button[type="submit"]');

    await page.goto('/admin/beta-invites');
    await expect(page.locator('[data-testid="beta-user-count"]')).toContainText('/ 500');
  });
});
````

**Test Onboarding Flow:**

```typescript
test.describe("Beta User Onboarding", () => {
  test("should show welcome tutorial for new beta users", async ({ page }) => {
    // Signup with beta code
    await page.goto("/signup");
    await page.fill('[name="email"]', "newbeta@example.com");
    await page.fill('[name="inviteCode"]', "beta-code-123");
    await page.fill('[name="password"]', "SecurePass123!");
    await page.click('[type="submit"]');

    // Should see tutorial
    await expect(page.locator('[data-testid="tutorial-modal"]')).toBeVisible();
    await expect(page.locator("text=Welcome to Story Hub Beta!")).toBeVisible();

    // Step through tutorial
    await page.click('[data-testid="tutorial-next"]');
    await expect(page.locator("text=Create your first story")).toBeVisible();
    await page.click('[data-testid="tutorial-next"]');
    await expect(page.locator("text=Branch from others")).toBeVisible();

    await page.click('[data-testid="tutorial-finish"]');
    await expect(
      page.locator('[data-testid="tutorial-modal"]'),
    ).not.toBeVisible();
  });
});
```

**Test Feedback Collection:**

```bash
# Test in-app feedback button
# Manual test: Click feedback button and submit feedback
# Verify it appears in admin dashboard

# Test post-action surveys
# After creating first story, should see survey
# After creating first branch, should see survey
```

### 2. Age Rating & Content Warning Testing

**Test Age Rating System:**

```typescript
// cypress/e2e/age-ratings.cy.ts
describe("Age Rating System", () => {
  it("should require age rating during story creation", () => {
    cy.login("user@example.com");
    cy.visit("/story/create");

    cy.get('[name="title"]').type("Test Story");
    cy.get('[name="synopsis"]').type(
      "A test synopsis that is at least 50 characters long.",
    );
    // Don't select age rating
    cy.get('[type="submit"]').click();

    cy.contains("Age rating is required");
  });

  it("should show age rating descriptions", () => {
    cy.visit("/story/create");
    cy.get('[data-testid="age-rating-select"]').click();

    cy.contains("General (G)");
    cy.contains("Suitable for all ages");
    cy.contains("Adult (18+)");
    cy.contains("explicit sexual content");
  });

  it("should gate 18+ content with age verification", () => {
    // Create 18+ story
    cy.createStory({
      title: "Adult Story",
      ageRating: "ADULT_18_PLUS",
      contentWarnings: ["Sexual Content", "Violence/Gore"],
    });

    // Log out and visit as new user
    cy.logout();
    cy.signup("younguser@example.com");
    cy.visit("/story/adult-story-id");

    // Should show age gate
    cy.get('[data-testid="age-gate-modal"]').should("be.visible");
    cy.contains("This story is rated 18+");
    cy.get('[data-testid="age-confirmation"]').check();
    cy.get('[data-testid="enter-story"]').click();

    // Now can view content
    cy.contains("Adult Story");
  });

  it("should allow flagging branch for rating increase", () => {
    cy.login("contributor@example.com");
    cy.visit("/story/story-1/read");

    // Create branch with mature content
    cy.get('[data-testid="paragraph-3"]').click();
    cy.get('[data-testid="create-branch"]').click();

    // Flag for rating increase
    cy.get('[data-testid="flag-rating-increase"]').check();
    cy.get('[data-testid="suggested-rating"]').select("M");
    cy.get('[data-testid="rating-reason"]').type(
      "Contains strong language and violence",
    );

    cy.get('[name="content"]').type("Branch content here. ".repeat(50));
    cy.get('[type="submit"]').click();

    // Original author should get notification
    cy.login("original-author@example.com");
    cy.get('[data-testid="notifications"]').click();
    cy.contains("Branch flagged for rating review");
  });
});
```

**Test Content Warnings:**

```typescript
describe("Content Warnings", () => {
  it("should allow adding multiple content warnings", () => {
    cy.visit("/story/create");

    cy.get('[data-testid="content-warnings"]').click();
    cy.get('[data-testid="warning-violence"]').check();
    cy.get('[data-testid="warning-language"]').check();
    cy.get('[data-testid="warning-custom"]').type("Spiders");

    cy.get('[type="submit"]').click();

    // Verify warnings displayed
    cy.get('[data-testid="story-warnings"]').should("contain", "Violence/Gore");
    cy.get('[data-testid="story-warnings"]').should(
      "contain",
      "Strong Language",
    );
    cy.get('[data-testid="story-warnings"]').should("contain", "Spiders");
  });

  it("should allow users to filter by content warnings", () => {
    cy.visit("/browse");

    cy.get('[data-testid="filters"]').click();
    cy.get('[data-testid="hide-violence"]').check();

    // Stories with violence warning should be hidden
    cy.get('[data-testid="story-list"]').should("not.contain", "Violent Story");
  });
});
```

### 3. Content Moderation Testing

**Test Automated Moderation:**

```typescript
// tests/moderation/filters.test.ts
import { checkProfanity, detectSpam } from "@/lib/moderation";

describe("Automated Moderation", () => {
  it("should detect profanity", () => {
    const result = checkProfanity("This contains bad words");
    expect(result.hasProfanity).toBe(true);
    expect(result.severity).toBe("medium");
  });

  it("should detect spam patterns", () => {
    const repeatedContent = "Buy now! ".repeat(100);
    const result = detectSpam(repeatedContent);
    expect(result.isSpam).toBe(true);
    expect(result.reason).toContain("repeated content");
  });

  it("should flag NSFW content without proper rating", () => {
    const story = {
      content: "explicit content here",
      ageRating: "G",
    };
    const result = checkContentMatch(story);
    expect(result.flagged).toBe(true);
    expect(result.reason).toContain("rating mismatch");
  });
});
```

**Test User Reporting:**

```typescript
// cypress/e2e/reporting.cy.ts
describe("User Reporting", () => {
  it("should allow users to report content", () => {
    cy.visit("/story/story-1");

    cy.get('[data-testid="report-button"]').click();
    cy.get('[data-testid="report-reason"]').select("Inappropriate age rating");
    cy.get('[data-testid="report-details"]').type(
      "This story contains adult content but is rated T",
    );
    cy.get('[data-testid="submit-report"]').click();

    cy.contains("Report submitted");
  });

  it("should add reports to moderation queue", () => {
    cy.login("moderator@example.com");
    cy.visit("/admin/moderation");

    cy.get('[data-testid="report-queue"]').should(
      "contain",
      "Inappropriate age rating",
    );
    cy.get('[data-testid="report-item-1"]').click();

    // Review and take action
    cy.get('[data-testid="adjust-rating"]').click();
    cy.get('[data-testid="new-rating"]').select("M");
    cy.get('[data-testid="confirm-action"]').click();

    cy.contains("Rating updated and reporter notified");
  });
});
```

**Test Rate Limiting:**

```bash
# Test story creation rate limit
for i in {1..10}; do
  curl -X POST https://api.thestoryhub.example.com/graphql \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"query":"mutation CreateStory($input: CreateStoryInput!) { createStory(input: $input) { storyId } }", "variables":{"input":{"title":"Story '$i'"}}}'
done

# After 5 stories per day, should get rate limit error:
# { "errors": [{ "message": "Daily story creation limit exceeded" }] }
```

### 4. Patreon Integration Testing

**Test OAuth Flow:**

```typescript
// cypress/e2e/patreon.cy.ts
describe("Patreon Integration", () => {
  it("should connect Patreon account", () => {
    cy.login("user@example.com");
    cy.visit("/profile/settings");

    cy.get('[data-testid="connect-patreon"]').click();

    // Mock Patreon OAuth (in real test, use OAuth mock)
    cy.url().should("include", "patreon.com/oauth2/authorize");

    // After redirect back with code
    cy.visit("/auth/patreon/callback?code=mock-code");

    cy.contains("Patreon account connected");
    cy.get('[data-testid="supporter-badge"]').should("be.visible");
  });

  it("should show supporter benefits", () => {
    cy.login("supporter@example.com"); // User with active Patreon pledge

    // Check for ad-free experience
    cy.visit("/browse");
    cy.get('[data-testid="advertisement"]').should("not.exist");

    // Check for supporter badge
    cy.visit("/profile/supporter@example.com");
    cy.get('[data-testid="supporter-badge"]').should("be.visible");

    // Check for increased limits
    cy.visit("/story/create");
    cy.get('[data-testid="upload-limit"]').should("contain", "10 MB"); // vs 2 MB for free
  });
});
```

**Test Webhook Handling:**

```typescript
// tests/api/patreon-webhook.test.ts
import { handlePatreonWebhook } from "@/lib/patreon/webhooks";

describe("Patreon Webhooks", () => {
  it("should handle new pledge event", async () => {
    const event = {
      type: "members:pledge:create",
      data: {
        attributes: {
          patron_status: "active_patron",
        },
        relationships: {
          user: { data: { id: "patreon-user-123" } },
        },
      },
    };

    await handlePatreonWebhook(event);

    // Verify user marked as supporter
    const user = await getUser("patreon-user-123");
    expect(user.isSupporter).toBe(true);
    expect(user.supporterSince).toBeDefined();
  });

  it("should handle pledge deletion", async () => {
    const event = {
      type: "members:pledge:delete",
      data: {
        relationships: {
          user: { data: { id: "patreon-user-123" } },
        },
      },
    };

    await handlePatreonWebhook(event);

    const user = await getUser("patreon-user-123");
    expect(user.isSupporter).toBe(false);
  });
});
```

### 5. Legal Compliance Verification

**GDPR Compliance Testing:**

```typescript
// cypress/e2e/gdpr.cy.ts
describe("GDPR Compliance", () => {
  it("should allow users to export their data", () => {
    cy.login("user@example.com");
    cy.visit("/profile/settings/privacy");

    cy.get('[data-testid="export-data"]').click();
    cy.contains("Your data export is being prepared");

    // Wait for export (mock in tests)
    cy.wait(2000);
    cy.get('[data-testid="download-export"]').click();

    // Verify downloaded file contains user data
    cy.readFile("downloads/user-data.json").should((data) => {
      expect(data).to.have.property("profile");
      expect(data).to.have.property("stories");
      expect(data).to.have.property("branches");
    });
  });

  it("should allow users to delete their account", () => {
    cy.login("user@example.com");
    cy.visit("/profile/settings/account");

    cy.get('[data-testid="delete-account"]').click();
    cy.get('[data-testid="confirm-delete"]').type("DELETE");
    cy.get('[data-testid="submit-delete"]').click();

    cy.contains("Account deleted");

    // Try to login - should fail
    cy.visit("/login");
    cy.get('[name="email"]').type("user@example.com");
    cy.get('[name="password"]').type("password");
    cy.get('[type="submit"]').click();
    cy.contains("Invalid credentials");
  });

  it("should show cookie consent banner", () => {
    cy.clearCookies();
    cy.visit("/");

    cy.get('[data-testid="cookie-banner"]').should("be.visible");
    cy.contains("We use cookies");

    cy.get('[data-testid="accept-cookies"]').click();
    cy.get('[data-testid="cookie-banner"]').should("not.exist");
  });
});
```

**COPPA Compliance:**

```typescript
describe("COPPA Compliance", () => {
  it("should prevent users under 13 from signing up", () => {
    cy.visit("/signup");

    cy.get('[name="email"]').type("child@example.com");
    cy.get('[name="dateOfBirth"]').type("2015-01-01"); // Under 13
    cy.get('[name="password"]').type("password");
    cy.get('[type="submit"]').click();

    cy.contains("You must be at least 13 years old");
  });

  it("should require age verification for 18+ content", () => {
    // Already covered in age rating tests
  });
});
```

**Terms of Service & Privacy Policy:**

```bash
# Manual verification checklist:
- [ ] Terms of Service page accessible at /terms
- [ ] Privacy Policy page accessible at /privacy
- [ ] Both documents reviewed by legal counsel
- [ ] Age requirements clearly stated
- [ ] Content guidelines included
- [ ] DMCA process documented
- [ ] Data handling explained
- [ ] User rights outlined (GDPR, COPPA)
- [ ] Monetization terms clear
- [ ] Liability disclaimers present
```

### 6. Pre-Launch Security Audit

**Security Testing:**

```bash
# Run comprehensive security audit
npm audit --audit-level=moderate

# Test SQL injection (AppSync/DynamoDB doesn't use SQL, but test input sanitization)
# Test XSS vulnerabilities
npx eslint . --ext .ts,.tsx --rule 'react/no-danger: error'

# Test CSRF protection
# Next.js handles CSRF automatically, but verify

# Test authentication edge cases
curl -X POST https://api.thestoryhub.example.com/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer expired-token" \
  -d '{"query":"{ listStories { items { title } } }"}'
# Should return 401

# Test authorization bypass attempts
# Try to modify another user's story
curl -X POST https://api.thestoryhub.example.com/graphql \
  -H "Authorization: Bearer $USER1_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query":"mutation { updateStory(storyId: \"user2-story-id\", input: {title: \"Hacked\"}) { storyId } }"}'
# Should return authorization error

# Test file upload limits
# Try to upload file > 10MB (or supporter limit)
# Should reject

# Test rate limiting (already covered above)
```

**Penetration Testing Checklist:**

- [ ] Authentication bypass attempts - FAILED ✅
- [ ] Authorization bypass attempts - FAILED ✅
- [ ] SQL injection attempts - N/A (DynamoDB)
- [ ] XSS attempts - SANITIZED ✅
- [ ] CSRF attempts - PROTECTED ✅
- [ ] File upload exploits - VALIDATED ✅
- [ ] Rate limiting bypass - ENFORCED ✅
- [ ] Session hijacking - PROTECTED ✅
- [ ] API abuse - RATE LIMITED ✅

### 7. Beta Launch Checklist

**Before Opening Beta:**

- [ ] Beta invite system working
- [ ] Invite codes generated (100-500 codes)
- [ ] Onboarding tutorial complete
- [ ] Feedback mechanisms in place
- [ ] Beta dashboard tracking metrics
- [ ] Discord/community server set up
- [ ] Welcome email templates ready
- [ ] Age rating system fully functional
- [ ] Content moderation tools operational
- [ ] Patreon integration tested (if launching with it)
- [ ] All legal documents published
- [ ] GDPR/COPPA compliance verified
- [ ] Security audit passed
- [ ] Monitoring dashboards configured
- [ ] Incident response plan documented
- [ ] Support email/system ready

**Beta Testing Focus:**

```typescript
// Create beta metrics dashboard query
const betaMetrics = {
  totalBetaUsers: "SELECT COUNT(*) FROM Users WHERE betaTester = true",
  storiesCreated: "Count of stories created in beta period",
  branchesCreated: "Count of branches created in beta period",
  averageTimeToFirstStory: "Time from signup to first story",
  completionRates: {
    tutorialCompleted: "Percentage who completed tutorial",
    firstStoryCreated: "Percentage who created first story",
    firstBranchCreated: "Percentage who created first branch",
    returnedAfter7Days: "7-day retention rate",
  },
  feedbackSubmitted: "Count of feedback submissions",
  bugReportsSubmitted: "Count of bug reports",
  topPainPoints: "Most common feedback themes",
};

// Monitor these metrics daily during beta
```

### 8. Production Launch Checklist

**Pre-Production Verification:**

```bash
# Final smoke tests on staging
yarn test:e2e:staging
yarn test:load:staging
yarn test:security:staging

# Database backup verification
aws dynamodb create-backup --table-name TheStoryHubDataTable-prod --backup-name pre-launch-backup

# CloudFormation stack validation
aws cloudformation validate-template --template-body file://packages/deploy/templates/the-story-hub/cfn-template.yaml

# Environment variables verification
# Verify all production env vars are set correctly

# DNS configuration
dig thestoryhub.com
dig www.thestoryhub.com
dig api.thestoryhub.com

# SSL certificate verification
curl -vI https://thestoryhub.com 2>&1 | grep -i "SSL certificate"

# CDN configuration
curl -I https://thestoryhub.com | grep -i "x-cache"
```

**Launch Day Monitoring:**

```bash
# Set up real-time monitoring dashboard
# Watch these metrics:

# Error rate (should be < 1%)
aws cloudwatch get-metric-statistics \
  --namespace TheStoryHub \
  --metric-name ErrorRate \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average

# API latency (p95 should be < 500ms)
# Active users
# Signup rate
# Story/branch creation rate
# Any 500 errors in logs
# DynamoDB throttling events
# Lambda cold start frequency
```

### 9. Manual Pre-Launch Testing

**Complete User Journey (Manual):**

1. [ ] Visit homepage as anonymous user
2. [ ] Sign up with new account
3. [ ] Verify email (or skip in test)
4. [ ] Complete onboarding tutorial
5. [ ] Browse existing stories
6. [ ] Read a story with branches
7. [ ] Navigate tree visualization
8. [ ] Create first story
9. [ ] Wait for moderation check (if applicable)
10. [ ] See story published
11. [ ] Have another user read and branch from your story
12. [ ] Receive notification about new branch
13. [ ] Review branch and mark "matches vision"
14. [ ] Upvote content
15. [ ] Bookmark stories
16. [ ] Search for stories
17. [ ] Update profile
18. [ ] Adjust privacy settings
19. [ ] Test on mobile device
20. [ ] Connect Patreon (if applicable)
21. [ ] Submit feedback
22. [ ] Log out and log back in

**Accessibility Testing:**

- [ ] Screen reader compatibility (NVDA/JAWS)
- [ ] Keyboard navigation works throughout site
- [ ] Color contrast meets WCAG AA standards
- [ ] Focus indicators visible
- [ ] Alt text on all images
- [ ] ARIA labels on interactive elements
- [ ] Form labels properly associated
- [ ] Error messages accessible

### 10. Troubleshooting Guide

**Common Beta/Launch Issues:**

1. **High signup rate overwhelming system:**

   - Monitor DynamoDB write capacity
   - Check Cognito rate limits
   - Verify email service (SES) sending limits
   - Enable CloudFront caching aggressively

2. **Content moderation queue backing up:**

   - Add more moderators
   - Tune automated filters
   - Increase rate limits if false positives

3. **Age gate causing user dropoff:**

   - Review copy and UX
   - Ensure process is clear and simple
   - Check analytics for dropoff points

4. **Patreon webhook failures:**
   - Check webhook endpoint is accessible
   - Verify signature validation
   - Review CloudWatch logs for errors
   - Test with Patreon webhook simulator

---

**If all Phase 5 tests pass, proceed to Phase 6!**

---

## Phase 6: Marketing & Growth

### Prompt 29: SEO Optimization

```
Optimize the platform for search engines:

**Technical SEO:**

1. **Meta Tags:**
   - Dynamic meta titles and descriptions for all pages
   - Open Graph tags for social sharing
   - Twitter Card tags
   - Canonical URLs

2. **Sitemap:**
   - Generate dynamic XML sitemap
   - Include all public stories
   - Update frequency indicators
   - Submit to Google Search Console

3. **Structured Data:**
   - Schema.org markup for:
     - CreativeWork (stories)
     - Person (authors)
     - Review (ratings)
     - BreadcrumbList (navigation)

4. **Performance:**
   - Server-side rendering for public pages
   - Optimize Core Web Vitals
   - Mobile-first indexing ready

**Content SEO:**

1. **Story Pages:**
   - Clean URLs: /story/title-slug
   - H1 tags with story titles
   - Meta descriptions from synopsis
   - Author attribution
   - Genre tags as keywords

2. **Author Pages:**
   - Unique meta descriptions
   - Bio content optimized
   - Portfolio of work

3. **Landing Pages:**
   - Target keywords: "collaborative storytelling", "branching narratives", "interactive fiction"
   - FAQ section with schema markup
   - Regular blog/content updates

4. **Internal Linking:**
   - Related stories
   - Same genre stories
   - Author's other works
   - Popular branches

**Social Media Optimization:**
- Auto-generate preview cards for shared stories
- Story summary with engaging hook
- Author credits
- Branch count and engagement stats
- Call-to-action: "Choose your own path"

Create monitoring for search rankings and organic traffic.
```

### Prompt 30: Launch Marketing Strategy

```
Create comprehensive launch marketing plan:

**Pre-Launch (4-6 weeks before):**

1. **Build Hype:**
   - Create landing page with email signup
   - "Coming Soon" with countdown
   - Teaser video explaining concept
   - Blog posts about collaborative storytelling

2. **Community Building:**
   - Create Discord server
   - Start subreddit r/YourPlatformName
   - Twitter/X account with dev updates
   - Instagram with visual teasers

3. **Press Kit:**
   - Platform overview
   - Founder story
   - Screenshots and demo video
   - Press contact info
   - Media assets (logos, banners)

4. **Influencer Outreach:**
   - Reach out to BookTubers
   - Writing community YouTubers
   - Podcast about storytelling/writing
   - Offer early access

**Launch Day:**

1. **Announcement:**
   - Product Hunt launch
   - Hacker News "Show HN"
   - Reddit posts (r/writing, r/worldbuilding, r/fanfiction)
   - Twitter thread with demo
   - LinkedIn post

2. **Content:**
   - Launch blog post
   - Demo video
   - User testimonials from beta
   - "How to get started" guide

3. **PR:**
   - Press release to tech blogs
   - Reach out to TechCrunch, Ars Technica
   - Submit to startup directories

**Post-Launch (First 3 months):**

1. **Content Marketing:**
   - Weekly blog posts:
     - "Story of the Week" features
     - Author interviews
     - Writing tips
     - Platform updates
   - Guest posts on writing blogs
   - YouTube tutorials

2. **Community Engagement:**
   - Weekly writing prompts
   - Monthly writing contests
   - Featured story collections
   - AMAs with popular authors

3. **Partnerships:**
   - Collaborate with writing communities
   - NaNoWriMo partnership
   - Creative writing courses
   - Fanfiction communities

4. **User-Generated Marketing:**
   - Encourage users to share their branches
   - "Share your path" feature
   - Social media hashtag campaign
   - User spotlight series

**Metrics to Track:**
- Daily signups
- Story creation rate
- Branch creation rate
- Retention (7-day, 30-day)
- Viral coefficient
- Traffic sources
- Conversion funnel

Create a content calendar for first 6 months.
```

### Prompt 31: Community Guidelines & Culture

```
Establish community guidelines and platform culture:

**Community Guidelines Document:**

1. **Core Principles:**
   - Respect and inclusivity
   - Creative freedom within bounds
   - Constructive collaboration
   - Original content or proper attribution
   - Quality over quantity

2. **Acceptable Content:**
   - Original creative works
   - Fanfiction (with disclaimers)
   - Collaborative storytelling
   - Respectful critique and feedback
   - Diverse genres and themes

3. **Prohibited Content:**
   - Hate speech and discrimination
   - Harassment and bullying
   - Explicit adult content without warnings
   - Spam and self-promotion
   - Copyright infringement
   - Doxxing and personal attacks
   - Plagiarism

4. **Branching Etiquette:**
   - Respect the original author's vision
   - Don't create spam branches
   - Provide meaningful continuations
   - Credit inspirations
   - Be gracious if your branch isn't chosen as canon

5. **Consequences:**
   - First offense: Warning
   - Repeated violations: Content removal
   - Serious violations: Account suspension
   - Severe violations: Permanent ban
   - Appeal process

**Building Positive Culture:**

1. **Welcome Program:**
   - New user tutorial
   - Community introduction thread
   - Mentor program (experienced users help newcomers)
   - First story celebration

2. **Recognition:**
   - "Contributor of the Month"
   - Badges for milestones (first story, 10 branches, etc.)
   - Hall of fame for exemplary behavior
   - Featured author spotlights

3. **Communication Channels:**
   - Community forum/Discord
   - Office hours with founders
   - Regular AMA sessions
   - Feedback town halls

4. **Content Quality Initiatives:**
   - Writing workshops
   - Peer review groups
   - Genre-specific communities
   - Collaborative anthology projects

5. **Moderation Team:**
   - Recruit trusted community members
   - Clear moderation guidelines
   - Training for moderators
   - Regular check-ins and support

Create a "Culture Playbook" for moderators and team.
```

### Prompt 32: Analytics Dashboard for Authors

```
Create analytics dashboard for story authors:

**Story Analytics Page (app/story/[storyId]/analytics):**
Only accessible to story author and contributors.

**Overview Metrics:**
- Total reads (unique and total)
- Total branches created
- Average rating
- Completion rate (how many finish vs start)
- Most popular branch paths
- Time spent reading (average)

**Engagement Over Time:**
- Line chart showing reads per day
- Branch creation timeline
- Rating trends
- Peak reading times

**Branch Analysis:**
- Tree heatmap showing most-read paths
- Dropout points (where readers stop)
- Most branched paragraphs
- Branch satisfaction (votes per branch)

**Reader Demographics (aggregated, anonymous):**
- Geographic distribution
- New vs returning readers
- Reading device (mobile/desktop)
- Referral sources

**Contributor Leaderboard:**
- Most popular branch contributors
- Most engaged contributors
- Recognition opportunities

**Export Options:**
- CSV export of raw data
- PDF report generation
- Share analytics link (public/private)

**Insights Panel:**
- AI-generated insights:
  - "Readers love your Chapter 3 twist"
  - "Consider your Chapter 5 pacing - high dropout"
  - "Your sci-fi tags are driving traffic"

**Comparison:**
- Compare your story to genre averages
- See how your story ranks
- Growth rate vs similar stories

Use Recharts for visualizations.
Make it beautiful and actionable, not just data dumps.
```

### Prompt 33: Mobile App Planning

```
Plan for native mobile apps (future phase):

**Feature Parity:**
- All web features available on mobile
- Optimized for mobile-first reading
- Offline reading capability
- Push notifications
- Native sharing

**Mobile-Specific Features:**

1. **Enhanced Reading:**
   - Swipe between chapters
   - Adjustable font size and themes
   - Night mode with warm colors
   - Text-to-speech integration
   - Bookmark syncing

2. **Writing on Mobile:**
   - Distraction-free writing mode
   - Voice-to-text for drafting
   - Auto-save and sync
   - Quick branching from reading view

3. **Social:**
   - Follow authors
   - Activity feed
   - Direct messaging (future)
   - Share to social media

4. **Notifications:**
   - New branch on followed story
   - Someone branched from you
   - Author marked your branch
   - Story updates
   - Community announcements

**Technical Stack Options:**

1. **React Native:**
   - Code sharing with web (React)
   - Single codebase for iOS/Android
   - Use Expo for faster development

2. **Flutter:**
   - High performance
   - Beautiful native UI
   - Good for complex visualizations

3. **Native (Swift/Kotlin):**
   - Best performance
   - Platform-specific features
   - Higher development cost

**App Store Optimization:**
- Compelling screenshots
- Demo video
- Clear description
- Keyword optimization
- Reviews and ratings strategy

**Monetization:**
- Same as web (Patreon + ads)
- In-app purchases for tips
- Premium subscription option

**Beta Testing:**
- TestFlight (iOS)
- Google Play Beta (Android)
- Beta tester community from web users

Create product requirements document for mobile apps.
Plan for 6-12 months post web launch.
```

---

## Phase 6 Verification: Marketing & Growth Metrics

**STOP AND TEST before proceeding to Phase 7**

Verify all marketing, SEO, and growth initiatives are properly implemented and tracking correctly.

### 1. SEO Verification

**Test Meta Tags:**

```bash
# Check homepage meta tags
curl -s https://thestoryhub.com | grep -E '<meta|<title'

# Expected output should include:
# <title>Story Hub - Collaborative Branching Stories</title>
# <meta name="description" content="...">
# <meta property="og:title" content="...">
# <meta property="og:image" content="...">
# <meta name="twitter:card" content="summary_large_image">
```

**Test Dynamic Story Pages:**

```typescript
// cypress/e2e/seo.cy.ts
describe("SEO Meta Tags", () => {
  it("should have correct meta tags on story page", () => {
    cy.visit("/story/story-1");

    // Check title
    cy.title().should("include", "The Enchanted Forest Chronicles");

    // Check meta description
    cy.get('meta[name="description"]')
      .should("have.attr", "content")
      .and("include", "magical forest");

    // Check Open Graph tags
    cy.get('meta[property="og:title"]')
      .should("have.attr", "content")
      .and("include", "The Enchanted Forest Chronicles");

    cy.get('meta[property="og:type"]').should(
      "have.attr",
      "content",
      "article",
    );

    // Check Twitter Card
    cy.get('meta[name="twitter:card"]').should(
      "have.attr",
      "content",
      "summary_large_image",
    );
  });

  it("should have canonical URLs", () => {
    cy.visit("/story/story-1");
    cy.get('link[rel="canonical"]')
      .should("have.attr", "href")
      .and("include", "/story/story-1");
  });
});
```

**Test Sitemap:**

```bash
# Verify sitemap exists and is accessible
curl -s https://thestoryhub.com/sitemap.xml | head -20

# Expected output:
# <?xml version="1.0" encoding="UTF-8"?>
# <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
#   <url>
#     <loc>https://thestoryhub.com/</loc>
#     <changefreq>daily</changefreq>
#     <priority>1.0</priority>
#   </url>
#   <url>
#     <loc>https://thestoryhub.com/story/story-1</loc>
#     <lastmod>2025-01-15</lastmod>
#   </url>
# </urlset>

# Submit sitemap to Google
# Visit Google Search Console and verify sitemap indexed
```

**Test Structured Data:**

```bash
# Test structured data with Google's tool
# Visit: https://search.google.com/test/rich-results
# Enter: https://thestoryhub.com/story/story-1

# Or use schema validator
curl -s https://thestoryhub.com/story/story-1 | grep -o '<script type="application/ld+json">.*</script>'

# Expected to find Schema.org markup for CreativeWork, Person, etc.
```

**Test robots.txt:**

```bash
curl https://thestoryhub.com/robots.txt

# Expected output:
# User-agent: *
# Allow: /
# Disallow: /admin
# Disallow: /api
# Sitemap: https://thestoryhub.com/sitemap.xml
```

### 2. Performance & Core Web Vitals

**Lighthouse Audit (Production):**

```bash
# Run Lighthouse on production
lighthouse https://thestoryhub.com --view

# Target scores:
# Performance: > 90
# Accessibility: > 90
# Best Practices: > 90
# SEO: > 95

# Check Core Web Vitals:
# LCP (Largest Contentful Paint): < 2.5s
# FID (First Input Delay): < 100ms
# CLS (Cumulative Layout Shift): < 0.1
```

**Real User Monitoring:**

```typescript
// Verify Web Vitals tracking
// pages/_app.tsx should include:
import { getCLS, getFID, getFCP, getLCP, getTTFB } from "web-vitals";

export function reportWebVitals(metric) {
  // Send to analytics
  console.log(metric);
  // Also send to your analytics service
}

// Check that metrics are being sent to analytics dashboard
```

**PageSpeed Insights:**

```bash
# Check PageSpeed Insights score
# Visit: https://pagespeed.web.dev/
# Enter: https://thestoryhub.com

# Verify:
# - Mobile score > 90
# - Desktop score > 95
# - All Core Web Vitals passing
```

### 3. Marketing Campaign Verification

**Test Landing Page:**

```typescript
// cypress/e2e/landing-page.cy.ts
describe("Landing Page", () => {
  it("should have clear value proposition", () => {
    cy.visit("/");

    cy.contains("Collaborative Branching Stories");
    cy.contains("Create stories where every reader can add their own branch");

    // CTA buttons
    cy.get('[data-testid="cta-signup"]').should("be.visible");
    cy.get('[data-testid="cta-browse"]').should("be.visible");
  });

  it("should show featured stories", () => {
    cy.visit("/");
    cy.get('[data-testid="featured-stories"]').should("exist");
    cy.get('[data-testid="featured-stories"]')
      .children()
      .should("have.length.greaterThan", 0);
  });

  it("should have working email signup", () => {
    cy.visit("/");
    cy.get('[data-testid="email-signup"]').type("interested@example.com");
    cy.get('[data-testid="email-submit"]').click();

    cy.contains("Thanks for your interest");
  });
});
```

**Test Social Sharing:**

```typescript
describe("Social Sharing", () => {
  it("should generate correct share preview for stories", () => {
    cy.visit("/story/story-1");

    // Get share URL
    cy.get('[data-testid="share-button"]').click();
    cy.get('[data-testid="share-twitter"]')
      .should("have.attr", "href")
      .and("include", "twitter.com/intent/tweet")
      .and("include", "The%20Enchanted%20Forest");

    cy.get('[data-testid="share-facebook"]')
      .should("have.attr", "href")
      .and("include", "facebook.com/sharer");
  });

  it("should copy share link", () => {
    cy.visit("/story/story-1");
    cy.get('[data-testid="share-button"]').click();
    cy.get('[data-testid="copy-link"]').click();

    cy.contains("Link copied");
  });
});
```

**Track UTM Parameters:**

```bash
# Test campaign tracking
curl -I "https://thestoryhub.com/?utm_source=reddit&utm_medium=social&utm_campaign=launch"

# Verify analytics captures UTM parameters
# Check Google Analytics / your analytics dashboard
```

### 4. Community Engagement Testing

**Test Community Guidelines:**

```bash
# Verify guidelines page exists
curl -s https://thestoryhub.com/guidelines | grep -i "community guidelines"

# Check that guidelines are clear and accessible
# Manual review:
- [ ] Guidelines page at /guidelines
- [ ] Clear rules about acceptable content
- [ ] Branching etiquette explained
- [ ] Consequences for violations outlined
- [ ] Appeal process described
```

**Test Welcome Program:**

```typescript
// cypress/e2e/welcome-program.cy.ts
describe("New User Welcome", () => {
  it("should show welcome message to new users", () => {
    cy.signup("newuser@example.com");

    cy.get('[data-testid="welcome-banner"]').should("be.visible");
    cy.contains("Welcome to Story Hub!");

    // Tutorial prompt
    cy.get('[data-testid="start-tutorial"]').should("be.visible");
  });

  it("should celebrate first story", () => {
    cy.login("newuser@example.com");
    cy.createStory({ title: "My First Story" });

    // Should see celebration
    cy.get('[data-testid="first-story-celebration"]').should("be.visible");
    cy.contains("Congratulations on your first story!");

    // Should get achievement badge
    cy.visit("/profile/newuser");
    cy.get('[data-testid="achievement-first-story"]').should("exist");
  });
});
```

**Test Recognition System:**

```typescript
describe("User Recognition", () => {
  it("should display badges on profile", () => {
    cy.visit("/profile/storyteller_alice");

    // Check for milestone badges
    cy.get('[data-testid="badge-prolific-writer"]').should("be.visible");
    cy.get('[data-testid="badge-10-stories"]').should("be.visible");
  });

  it("should show contributor of the month", () => {
    cy.visit("/");
    cy.get('[data-testid="contributor-spotlight"]').should("exist");
    cy.contains("Contributor of the Month");
  });
});
```

### 5. Analytics Dashboard Testing

**Verify Tracking:**

```typescript
// Test analytics events are firing
describe("Analytics Tracking", () => {
  beforeEach(() => {
    cy.visit("/");
    cy.window().then((win) => {
      // Spy on analytics calls
      cy.spy(win, "gtag").as("gtag");
      // or your analytics service
    });
  });

  it("should track story view", () => {
    cy.visit("/story/story-1");

    cy.get("@gtag").should("have.been.calledWith", "event", "view_story", {
      story_id: "story-1",
    });
  });

  it("should track story creation", () => {
    cy.login("user@example.com");
    cy.createStory({ title: "New Story" });

    cy.get("@gtag").should("have.been.calledWith", "event", "create_story");
  });

  it("should track branch creation", () => {
    cy.login("user@example.com");
    cy.visit("/story/story-1/read");
    cy.createBranch();

    cy.get("@gtag").should("have.been.calledWith", "event", "create_branch");
  });
});
```

**Test Author Analytics:**

```typescript
// cypress/e2e/author-analytics.cy.ts
describe("Author Analytics Dashboard", () => {
  beforeEach(() => {
    cy.login("storyteller_alice@example.com");
  });

  it("should show story analytics", () => {
    cy.visit("/story/story-1/analytics");

    // Overview metrics
    cy.get('[data-testid="total-reads"]').should("contain", "156");
    cy.get('[data-testid="total-branches"]').should("contain", "8");
    cy.get('[data-testid="average-rating"]').should("contain", "4.5");

    // Charts
    cy.get('[data-testid="reads-chart"]').should("be.visible");
    cy.get('[data-testid="branch-timeline"]').should("be.visible");
  });

  it("should show reader demographics", () => {
    cy.visit("/story/story-1/analytics");

    cy.get('[data-testid="demographics-section"]').should("exist");
    cy.contains("Geographic Distribution");
    cy.contains("Reading Device");
  });

  it("should allow exporting analytics", () => {
    cy.visit("/story/story-1/analytics");

    cy.get('[data-testid="export-csv"]').click();
    // Verify download started
    cy.readFile("downloads/story-1-analytics.csv").should("exist");
  });
});
```

### 6. Content Marketing Verification

**Test Blog/Content:**

```bash
# Verify blog exists
curl -s https://thestoryhub.com/blog | grep -i "<article"

# Check RSS feed
curl -s https://thestoryhub.com/blog/rss.xml | head -20

# Expected:
# <?xml version="1.0" encoding="UTF-8"?>
# <rss version="2.0">
#   <channel>
#     <title>Story Hub Blog</title>
#     ...
#   </channel>
# </rss>
```

**Email Marketing:**

```typescript
// Test email signup and campaigns
describe("Email Marketing", () => {
  it("should allow newsletter signup", () => {
    cy.visit("/");

    cy.get('[data-testid="newsletter-signup"]').type("reader@example.com");
    cy.get('[data-testid="newsletter-submit"]').click();

    cy.contains("Subscribed successfully");
  });

  it("should allow unsubscribe", () => {
    // Visit unsubscribe link (from email)
    cy.visit("/unsubscribe?email=reader@example.com&token=xyz");

    cy.get('[data-testid="confirm-unsubscribe"]').click();
    cy.contains("Successfully unsubscribed");
  });
});
```

### 7. Growth Metrics Monitoring

**Key Metrics Dashboard:**

```bash
# Create monitoring query for key growth metrics

# Daily Active Users (DAU)
# SELECT COUNT(DISTINCT userId) FROM Events WHERE date = today

# Weekly Active Users (WAU)
# SELECT COUNT(DISTINCT userId) FROM Events WHERE date >= last_7_days

# Monthly Active Users (MAU)
# SELECT COUNT(DISTINCT userId) FROM Events WHERE date >= last_30_days

# New Signups (Daily)
# SELECT COUNT(*) FROM Users WHERE created_at >= today

# Story Creation Rate
# SELECT COUNT(*) FROM Stories WHERE created_at >= today

# Branch Creation Rate
# SELECT COUNT(*) FROM Branches WHERE created_at >= today

# Retention Rate (7-day)
# SELECT COUNT(users who returned after 7 days) / COUNT(total signups 7 days ago)
```

**Viral Coefficient:**

```typescript
// Calculate viral coefficient
const viralCoefficient = {
  // K = (number of invites sent per user) × (conversion rate of invites)
  invitesSentPerUser: 3.5, // Average invites sent
  conversionRate: 0.15, // 15% of invites convert to signups
  k: 3.5 * 0.15, // = 0.525

  // K > 1 = viral growth
  // K < 1 = need other growth channels
};

// Monitor this metric weekly
```

**Conversion Funnel:**

```bash
# Track conversion at each step

# Homepage visit → Signup
# Signup → Email verification
# Email verification → First login
# First login → Tutorial completion
# Tutorial completion → First story created
# First story created → Second story created (retention)

# Calculate dropoff at each step
# Optimize steps with highest dropoff
```

### 8. Search & Discovery Testing

**Test Search Functionality:**

```typescript
// cypress/e2e/search.cy.ts
describe("Search and Discovery", () => {
  it("should return relevant results", () => {
    cy.visit("/");

    cy.get('[data-testid="search-input"]').type("enchanted forest");
    cy.get('[data-testid="search-submit"]').click();

    cy.get('[data-testid="search-results"]').should("exist");
    cy.contains("The Enchanted Forest Chronicles");
  });

  it("should filter by genre", () => {
    cy.visit("/browse");

    cy.get('[data-testid="filter-genre"]').select("Fantasy");
    cy.get('[data-testid="apply-filters"]').click();

    cy.get('[data-testid="story-card"]').each(($el) => {
      cy.wrap($el).should("contain", "Fantasy");
    });
  });

  it("should sort results", () => {
    cy.visit("/browse");

    cy.get('[data-testid="sort-by"]').select("Most Popular");

    // First story should have higher read count than last
    cy.get('[data-testid="story-card"]')
      .first()
      .find('[data-testid="read-count"]')
      .invoke("text")
      .then((firstCount) => {
        cy.get('[data-testid="story-card"]')
          .last()
          .find('[data-testid="read-count"]')
          .invoke("text")
          .should((lastCount) => {
            expect(parseInt(firstCount)).to.be.greaterThan(parseInt(lastCount));
          });
      });
  });
});
```

**Test Recommendations:**

```typescript
describe("Recommendation Engine", () => {
  it("should show personalized recommendations", () => {
    cy.login("user@example.com");
    cy.visit("/");

    cy.get('[data-testid="for-you-section"]').should("exist");
    cy.get('[data-testid="recommended-story"]').should(
      "have.length.greaterThan",
      0,
    );
  });

  it("should show similar stories", () => {
    cy.visit("/story/story-1");

    cy.get('[data-testid="similar-stories"]').should("exist");
    cy.contains("Readers also enjoyed");
  });
});
```

### 9. Marketing Campaign Checklist

**Pre-Launch Marketing:**

- [ ] Landing page optimized and live
- [ ] SEO meta tags on all pages
- [ ] Sitemap submitted to Google/Bing
- [ ] Google Analytics configured
- [ ] Social media accounts created (Twitter, Instagram, etc.)
- [ ] Press kit prepared
- [ ] Demo video created
- [ ] Blog launched with initial posts
- [ ] Email marketing service configured
- [ ] Community Discord/Slack set up

**Launch Day Marketing:**

- [ ] Product Hunt submission
- [ ] Hacker News "Show HN" post
- [ ] Reddit posts in relevant subreddits
- [ ] Twitter launch thread
- [ ] LinkedIn announcement
- [ ] Email to beta testers
- [ ] Press release sent to tech blogs
- [ ] Blog post published
- [ ] Social media posts scheduled

**Post-Launch Marketing (First Month):**

- [ ] Weekly blog posts published
- [ ] "Story of the Week" features
- [ ] User testimonials collected
- [ ] Email digest sent to subscribers
- [ ] Social media engagement daily
- [ ] Community events scheduled
- [ ] Influencer outreach follow-ups
- [ ] SEO monitoring and optimization

### 10. Growth Metrics Targets

**Week 1 Targets:**

- [ ] 100+ signups
- [ ] 50+ stories created
- [ ] 100+ branches created
- [ ] 7-day retention > 30%
- [ ] No critical bugs reported

**Month 1 Targets:**

- [ ] 1,000+ signups
- [ ] 500+ stories created
- [ ] 2,000+ branches created
- [ ] 30-day retention > 20%
- [ ] Product Hunt ranking top 10
- [ ] 10+ press mentions

**Month 3 Targets:**

- [ ] 5,000+ signups
- [ ] 2,500+ stories created
- [ ] 10,000+ branches created
- [ ] MAU/DAU ratio > 0.25
- [ ] Organic traffic > 50% of total
- [ ] Viral coefficient > 0.5

### 11. Troubleshooting Guide

**Common Marketing Issues:**

1. **Low signup conversion:**

   - A/B test landing page copy
   - Simplify signup flow
   - Add social proof (user count, testimonials)
   - Improve value proposition clarity

2. **High bounce rate:**

   - Check page load speed
   - Improve above-the-fold content
   - Make CTA more prominent
   - Add engaging visuals

3. **Low SEO traffic:**

   - Check Google Search Console for indexing issues
   - Improve page titles and meta descriptions
   - Add more internal linking
   - Create more content targeting keywords

4. **Social sharing not working:**

   - Validate Open Graph tags
   - Test with Facebook/Twitter debugger
   - Ensure images are correct size
   - Add explicit share buttons

5. **Poor email open rates:**
   - Improve subject lines
   - Segment audience better
   - Send at optimal times (test)
   - Personalize content

---

**If all Phase 6 metrics are tracking correctly and targets are on track, proceed to Phase 7 (Future Features)!**

---

## Phase 7: Advanced Features (Future)

### Prompt 34: AI Writing Assistant

```
Integrate AI writing assistant features:

**Writing Suggestions:**
- Grammar and style checking
- Suggest continuations when stuck
- Character consistency checker
- Plot hole detection
- Pacing analysis

**Branch Suggestions:**
- AI suggests interesting branch points
- "Readers might want to explore X here"
- Generate branch description ideas
- Predict popular branch directions

**Content Generation:**
- "Continue writing" suggestion (like Copilot)
- Character name generator
- Setting descriptions
- Dialogue polish

**Story Analysis:**
- Sentiment analysis (tone consistency)
- Reading level assessment
- Genre classification
- Theme extraction

**Ethical Considerations:**
- Clearly mark AI-suggested content
- Allow authors to opt-out
- Never replace human creativity
- Use AI as tool, not author

**Implementation:**
- OpenAI API integration
- Anthropic Claude API integration
- Fine-tuned models for specific features
- On-demand vs always-on options

**Privacy:**
- User content privacy protection
- Opt-in for AI features
- No training on user content without permission
- Transparent about data usage

Introduce gradually with user education.
```

### Prompt 35: Collaborative Writing Tools

```
Add real-time collaborative writing features:

**Co-Author Invitations:**
- Invite users to co-write a story
- Set permissions (can edit / suggest only)
- Credit all co-authors

**Real-Time Editing:**
- WebSocket connection for live updates
- Show who's currently editing
- Cursor presence (like Google Docs)
- Lock paragraphs during editing
- Conflict resolution

**Suggestion Mode:**
- Co-authors can suggest changes
- Original author approves/rejects
- Track changes view
- Comment threads on text

**Version History:**
- Git-like version control
- See all edits over time
- Revert to previous versions
- Compare versions side-by-side
- Blame view (who wrote what)

**Planning Tools:**
- Shared story outline
- Character profiles (shared database)
- Plot timeline
- World-building wiki
- Shared mood boards

**Communication:**
- In-story comments
- Project chat room
- @mentions for notifications
- Task assignments

**Workflow:**
- Draft → Review → Publish states
- Approval process for co-authored work
- Split credit and tips between co-authors

Use WebRTC or WebSocket for real-time features.
Consider operational transform for conflict resolution.
```

### Prompt 36: Story Merging & Convergence

```
Implement branch merging functionality:

**Merge Mechanics:**

1. **Identifying Convergence Points:**
   - Authors mark their branches as "converges with X"
   - AI suggests potential merge points
   - Community votes on merge appropriateness

2. **Merge Process:**
   - Branch A author proposes merge with Branch B
   - Branch B author reviews and approves
   - Merged node created that both branches lead to
   - Tree visualization shows convergence

3. **Merge Conditions:**
   - Plot must logically connect
   - Character states must align
   - Timeline consistency
   - Approval from both branch authors

4. **Visual Representation:**
   - Tree shows branches converging into single node
   - Different color for merged nodes
   - Show both source branches

**Use Cases:**

1. **Different approaches, same outcome:**
   - Branch A: Alice convinces government through diplomacy
   - Branch B: Alice leaks information publicly
   - Both lead to: Government agrees to help

2. **Parallel storylines:**
   - Branch A follows Alice
   - Branch B follows a different character
   - They merge when characters meet

3. **Time jumps:**
   - Multiple branches explore different paths
   - All merge at "5 years later" convergence point

**Technical Implementation:**
- New node type: MergedNode
- References to parent branches
- Special handling in tree traversal
- Reader sees seamless transition

**UI/UX:**
- "Merge paths" button when reading branches
- Merge proposal interface
- Notification to other author
- Preview how merge will look
- Community feedback on merges

**Challenges:**
- Preventing merge abuse (spam merges)
- Ensuring quality at merge points
- Handling disagreements between authors
- Tree complexity with many merges

Start with simple merges, iterate based on usage patterns.
```

### Prompt 37: Story Export & Publishing

```
Add story export and external publishing features:

**Export Formats:**

1. **PDF:**
   - Beautiful typography
   - Chapter breaks
   - Cover page with title, author(s)
   - Table of contents
   - Branch indicators ("This version follows path X")
   - Contributor credits
   - Generated with LaTeX or similar

2. **EPUB:**
   - For e-readers (Kindle, Kobo, etc.)
   - Proper chapter navigation
   - Embedded fonts
   - Metadata (title, authors, genre)

3. **Markdown:**
   - Plain text with formatting
   - Easy to import elsewhere
   - Include YAML frontmatter

4. **JSON:**
   - Full story tree structure
   - For developers/archival
   - Can reimport to platform

**Path Selection for Export:**
- "Export this path": specific branch sequence
- "Export canonical path": author's vision branches
- "Export all branches": complete tree (advanced)

**Publishing Integration:**

1. **Amazon KDP:**
   - Format for Kindle Direct Publishing
   - One-click export to KDP-ready format
   - Preserve formatting

2. **Print-on-Demand:**
   - Format for Lulu, IngramSpark
   - Include ISBN options
   - Cover generator

3. **Medium/Substack:**
   - Export to blog platforms
   - Maintain formatting
   - Include attribution

**Collaborative Work Publishing:**
- Fair attribution to all contributors
- Split royalties if monetized externally
- Legal framework for IP rights
- Contribution percentage calculator

**Copyright & Licensing:**
- Author chooses license (All Rights Reserved, CC, etc.)
- Branch contributors agree to terms
- Clear IP ownership
- Export includes license information

**Premium Feature:**
- Free users: basic exports (PDF, text)
- Supporters: all formats, advanced options
- Authors keep all rights to exported work

Create template designs for PDF exports.
Partner with publishing consultants for guidance.
```

### Prompt 38: Gamification & Achievements

```
Add gamification to increase engagement:

**Achievement System:**

**Writing Achievements:**
- First Story: "The Beginning"
- 10 Chapters Written: "Dedicated Author"
- 100K Words Written: "Novelist"
- First Branch Created: "Pathfinder"
- 50 Branches Contributed: "Master Storyteller"
- Story with 100+ Branches: "Community Catalyst"

**Reading Achievements:**
- Read First Story: "Bookworm"
- Read 100 Chapters: "Page Turner"
- Explore 10 Different Branches: "Path Explorer"
- Read Complete Story (all branches): "Completionist"

**Community Achievements:**
- First Upvote Given: "Supporter"
- 100 Upvotes Received: "Beloved Author"
- "Matches Vision" Badge: "Canon Contributor"
- Help 10 Authors: "Mentor"

**Streak Achievements:**
- 7-Day Writing Streak: "Committed"
- 30-Day Reading Streak: "Addicted"
- Contributed Every Day This Month: "Prolific"

**Special Achievements:**
- Easter egg discoveries
- Participate in site events
- Beta tester badge
- Early supporter badge
- Founding member

**Leaderboards:**

1. **Global:**
   - Most upvoted author (all time / this month)
   - Most prolific writer
   - Most branches created
   - Most stories completed

2. **Genre-Specific:**
   - Top sci-fi author
   - Best fantasy worldbuilder
   - etc.

3. **Story-Specific:**
   - Top contributor to this story
   - Most popular branch in this story

**Rewards:**

- Profile badges (displayed prominently)
- Special flair on contributions
- Unlock features (custom themes, etc.)
- Recognition in newsletter
- Profile customization options
- Priority in "Featured" sections

**Progress Tracking:**
- Progress bars for achievements
- "Next milestone" notifications
- Achievement showcase on profile
- Share achievements on social media

**Implementation:**
- Achievement table in DynamoDB
- Lambda triggers on user actions
- Real-time notifications when earned
- Beautiful unlock animations (Framer Motion)

Make achievements meaningful, not spammy.
Focus on quality contributions over quantity.
```

### Prompt 39: Advanced Search & Recommendations

```
Implement intelligent search and recommendation engine:

**Advanced Search Features:**

1. **Full-Text Search:**
   - Search across all story content
   - Highlighting of matched text
   - Search within specific story
   - Search within genre

2. **Filters:**
   - Word count ranges
   - Completion status
   - Rating minimum
   - Number of branches
   - Last updated date
   - Language
   - Content warnings/age rating

3. **Faceted Search:**
   - Dynamic filters based on results
   - "Similar stories" suggestions
   - Related tags

4. **Search Operators:**
   - Exact phrases: "exact match"
   - Exclude terms: -unwanted
   - Author search: author:username
   - Genre search: genre:scifi

**Recommendation Engine:**

1. **Personalized Recommendations:**
   - Based on reading history
   - Based on genres you like
   - Authors you follow
   - Similar to stories you rated highly

2. **Collaborative Filtering:**
   - "Readers who liked X also liked Y"
   - Find similar users' favorites
   - Discover hidden gems

3. **Content-Based Recommendations:**
   - Analyze story themes, writing style
   - Suggest similar narratives
   - Tag-based similarity

4. **Trending & Viral:**
   - Stories gaining momentum
   - Breakout stories this week
   - Underrated gems

**"For You" Feed:**
- Personalized homepage
- Mix of:
  - Recommended stories
  - Updates from followed authors
  - Popular in your genres
  - New branches on bookmarked stories
- Refresh algorithm based on engagement

**Email Digests:**
- Weekly personalized recommendations
- "You might have missed" section
- Trending in your genres
- Opt-in, customizable frequency

**Technical Implementation:**

1. **Search:**
   - Elasticsearch or Algolia for full-text search
   - Index story content, metadata
   - Real-time indexing on updates
   - Typo tolerance, fuzzy matching

2. **Recommendations:**
   - User-item matrix for collaborative filtering
   - Content embeddings for similarity
   - A/B test recommendation algorithms
   - Track click-through rates

**Privacy:**
- Anonymous aggregated data for recommendations
- Opt-out of personalization
- Clear explanation of how recommendations work
- No tracking across other sites

Build iteratively, start with simple recommendations.
```

### Prompt 40: Internationalization & Localization

```
Prepare platform for international users:

**Multi-Language Support:**

1. **UI Localization:**
   - English (default)
   - Spanish
   - French
   - German
   - Portuguese
   - Japanese
   - Korean
   - Chinese (Simplified & Traditional)
   - More as community grows

2. **Implementation:**
   - Use i18next or next-intl
   - Extract all UI strings
   - JSON translation files
   - Language switcher in nav
   - Remember user preference
   - Auto-detect browser language

3. **Date/Time Localization:**
   - Display in user's timezone
   - Locale-appropriate formats
   - "Time ago" in user's language

**Content Language:**

1. **Story Language Tags:**
   - Authors tag story language
   - Filter/search by language
   - Multi-language stories (translations)

2. **Translation Features:**
   - Allow community translations of stories
   - Branch for translations (parallel tree)
   - Link original and translated versions
   - Translator credit

3. **Unicode Support:**
   - Full support for all scripts
   - RTL (Right-to-Left) for Arabic, Hebrew
   - Complex scripts (Thai, Hindi, etc.)
   - Emoji support

**Regional Considerations:**

1. **Content Moderation:**
   - Region-specific rules
   - Comply with local laws (GDPR, etc.)
   - Content warnings / ratings by region

2. **Payments:**
   - Multi-currency support for tips
   - Region-appropriate payment methods
   - Tax compliance

3. **Cultural Sensitivity:**
   - Diverse moderator team
   - Cultural consultation
   - Inclusive content guidelines

**Community Building:**

- Language-specific Discord channels
- Regional community leaders
- Translate key docs (guidelines, FAQ)
- Localized marketing

**Technical:**
- Separate CDN regions for better latency
- CloudFront edge locations
- Regional AWS endpoints
- Performance monitoring by region

Start with English, add languages based on user demand.
Hire native speakers for quality translations.
```

---

## Summary Prompt: Complete System Overview

### Prompt 41: Integration & Final Review

```
You've now built a complete story branching platform. Let's review and integrate everything:

**System Architecture Overview:**

```

Frontend (Next.js 15 + React 19)
├── App Router structure
├── Server and Client Components
├── NextUI components + Tailwind
├── AWS Amplify Auth (Cognito)
├── TanStack Query for data fetching
├── Zustand for state management
└── React Flow for tree visualization

Backend (AWS Serverless)
├── AppSync (GraphQL API)
├── AppSync Pipeline Resolvers (TypeScript)
│ ├── Story operations (Query/Mutation)
│ ├── Chapter/Branch operations
│ ├── User management
│ ├── Voting & badges
│ └── Image management
├── Lambda Functions (for S3 triggers, notifications)
│ ├── Image processing (S3 trigger)
│ └── Notification handlers
├── DynamoDB (data storage, single-table design)
├── S3 + CloudFront (images/assets)
└── CloudWatch (logging/monitoring)

Infrastructure Dependencies (automatically handled)
├── WAF Stack (required first, us-east-1)
│ └── Web Application Firewall for CloudFront
└── Shared Stack (required second)
├── VPC (Virtual Private Cloud)
├── KMS (Key Management Service)
└── Common resources shared across apps

Shared
├── Zod schemas (validation)
├── TypeScript types
└── Utility functions

```

**Core Features Checklist:**

✅ User authentication (Cognito)
✅ Story creation with synopsis + Chapter 1
✅ Branching from any paragraph (except Chapter 1)
✅ Branch descriptions (editable for 1 hour)
✅ Tree visualization with React Flow
✅ Reading view with branch selection
✅ Voting system (upvote/downvote)
✅ "Matches my vision" badges (original author)
✅ "Author approved" badges (branch authors)
✅ User profiles with stats
✅ Bookmarking and reading progress
✅ Search and discovery
✅ Notifications
✅ Image uploads (covers, avatars)
✅ Analytics dashboard for authors
✅ Content moderation tools
✅ Patreon integration
✅ Responsive mobile design
✅ SEO optimization

**Testing Strategy:**

1. **Unit Tests:**
   - All Lambda handlers
   - React components
   - Utility functions
   - Validation schemas

2. **Integration Tests:**
   - API endpoint flows
   - Auth flows
   - Data consistency

3. **E2E Tests (Playwright):**
   - User signup → create story → branch flow
   - Reading and bookmarking
   - Search and discovery
   - Profile management

4. **Performance Tests:**
   - Load testing API endpoints
   - Tree rendering with 1000+ nodes
   - Image upload/optimization
   - Concurrent users

**Deployment Checklist:**

□ WAF Stack deployed (required dependency, us-east-1)
□ Shared Stack deployed (required dependency, provides VPC/KMS)
□ Environment variables configured
□ CloudFormation stacks deployed
□ Database tables created with indexes
□ S3 bucket and CloudFront configured
□ Lambda functions deployed (S3 triggers, etc.)
□ AppSync API deployed and configured
□ AppSync resolvers deployed
□ GraphQL schema validated
□ Cognito user pool set up
□ Monitoring and alarms configured
□ Error tracking (Sentry) enabled
□ SSL certificates configured
□ Domain configured
□ Email service (SES) set up

**Launch Day Tasks:**

□ Final security audit
□ Load testing completed
□ Backup strategy verified
□ Support email/chat ready
□ Community guidelines published
□ Terms of Service live
□ Privacy Policy live
□ Press kit prepared
□ Social media accounts ready
□ Product Hunt submission
□ Blog post published
□ Email beta testers
□ Monitor dashboards all day

**Post-Launch Monitoring:**

- Error rates (< 1% target)
- API latency (< 500ms p95)
- User signups
- Story creation rate
- Branch creation rate
- Server costs
- User feedback
- Bug reports

**Documentation Complete:**

- README with setup instructions
- API documentation
- User guide
- Admin manual
- Deployment runbook
- Incident response plan
- Roadmap for next features

**Future Roadmap:**

Phase 1 (Months 1-3): Core platform ✅
Phase 2 (Months 4-6): Mobile apps
Phase 3 (Months 7-9): AI writing assistant
Phase 4 (Months 10-12): Collaborative tools
Phase 5 (Year 2): Advanced features (merging, publishing, gamification)

---

Review each component, ensure integration between frontend and backend, run full test suite, and prepare for launch!

Create a launch checklist and track progress daily.
```
