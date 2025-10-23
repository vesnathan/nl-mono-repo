# Architecture Fixes Needed for story-branch-prompts.md

## Critical Issues Found

### **Phase 1: Foundation & Data Models**

#### **Prompt 1 (Lines 18-53) - Project Setup & Shared Types**

**Issues:**
1. Line 24: Says "AWS Lambda (serverless)" - misleading, should clarify AppSync resolvers vs Lambda
2. Line 36: Says "Lambda function handlers and shared TypeScript types/Zod schemas"

**Fixes Needed:**
```markdown
Tech stack:
- Next.js 15 (App Router)
- React 19
- AWS AppSync (GraphQL API)
- AppSync Pipeline Resolvers (TypeScript)
- Lambda Functions (for S3 triggers and background jobs only)
- DynamoDB
- S3 + CloudFront
- Cognito for auth
- TypeScript
- Zod for validation
- AWS Amplify (for GraphQL client and auth)
- NextUI for components
- Tailwind CSS

Create a monorepo structure with:
1. the-story-hub/frontend - Next.js application
2. the-story-hub/backend - AppSync resolvers, Lambda functions, and shared TypeScript types/Zod schemas
   - backend/resolvers/ - AppSync Pipeline Resolvers (TypeScript)
   - backend/lambda/ - Lambda functions (S3 triggers, etc.)
   - backend/schema/ - GraphQL schema files
   - backend/constants/ - Shared constants and Zod schemas
3. deploy/templates/the-story-hub - CloudFormation templates
4. deploy/packages/the-story-hub - Deployment configuration

In the-story-hub/backend/constants, create Zod schemas for:
[rest remains the same]
```

#### **Prompt 3.5 (Lines 111-154) - GraphQL Schema Definition**

**Issues:**
1. Line 114: Says "Place in: the-story-hub/backend/schema.graphql (or split into multiple files)"
2. Missing information about build process
3. Missing information about schema upload to S3

**Fixes Needed:**
```markdown
### Prompt 3.5: GraphQL Schema Definition
```
Create the GraphQL schema for AppSync API.
Place schema files in: **the-story-hub/backend/schema/** directory

Following the aws-example pattern:
- Split schema into multiple .graphql files by domain
- Example structure:
  - backend/schema/Story.graphql (type definitions)
  - backend/schema/stories.graphql (Query/Mutation operations)
  - backend/schema/ChapterNode.graphql
  - backend/schema/chapters.graphql
  - backend/schema/User.graphql
  - backend/schema/users.graphql

**Build Process:**
- The frontend build script (yarn build-gql) merges all .graphql files into combined_schema.graphql
- This combined schema is uploaded to S3 during deployment
- AppSync CloudFormation template references: s3://${TemplateBucketName}/schema.graphql
- TypeScript types are auto-generated from the schema using graphql-codegen

**Schema Structure:**

**Types (in Story.graphql):**
```graphql
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
}

input CreateStoryInput {
  title: String!
  synopsis: String!
  genre: [String!]!
  ageRating: AgeRating!
  contentWarnings: [String!]!
  ratingExplanation: String
}

input UpdateStoryInput {
  storyId: ID!
  title: String
  synopsis: String
  genre: [String!]
  ageRating: AgeRating
  contentWarnings: [String!]
  featured: Boolean
}
```

[Continue with all other types...]

**Queries and Mutations (in stories.graphql):**
```graphql
type Query {
  getStory(storyId: ID!): Story @aws_cognito_user_pools
  listStories(filter: StoryFilter, limit: Int, nextToken: String): StoryConnection @aws_cognito_user_pools
  # ... other queries
}

type Mutation {
  createStory(input: CreateStoryInput!): Story @aws_cognito_user_pools
  updateStory(input: UpdateStoryInput!): Story @aws_cognito_user_pools
  # ... other mutations
}
```

**Subscriptions:**
```graphql
type Subscription {
  onNewNotification(userId: ID!): Notification
    @aws_subscribe(mutations: ["createNotification"])
  onNewBranch(storyId: ID!): ChapterNode
    @aws_subscribe(mutations: ["createBranch"])
}
```

Use proper GraphQL directives:
- @aws_cognito_user_pools for authenticated operations
- @aws_iam for internal/admin operations
- @aws_subscribe for subscriptions
```
```

### **Phase 2: Backend GraphQL Resolvers**

#### **All Resolver Prompts (4-8) - Missing Build Process Info**

**Issue:**
Prompts don't explain how resolvers are compiled and deployed

**Fix Needed - Add to each resolver prompt:**
```markdown
**Resolver Structure:**
- Each resolver has two exports: `request()` and `response()`
- Request function: prepares DynamoDB operation or Lambda invocation
- Response function: transforms the result
- Use AppSync utilities: `import { util, Context, AppSyncIdentityCognito } from "@aws-appsync/utils"`
- Types imported from frontend: `import { TypeName } from "gqlTypes"`

**Build Process:**
- Resolvers are compiled from TypeScript to JavaScript
- Uploaded to S3 bucket during deployment
- AppSync CloudFormation template creates resolver resources pointing to S3 locations
- Each resolver needs a corresponding entry in the AppSync CFN template

**Example Resolver Pattern:**
```typescript
import { util, Context, AppSyncIdentityCognito } from "@aws-appsync/utils";
import { Story, CreateStoryInput } from "gqlTypes";

type CTX = Context<{ input: CreateStoryInput }, object, object, object, Story>;

export function request(ctx: CTX) {
  const { input } = ctx.args;
  const identity = ctx.identity as AppSyncIdentityCognito;

  return {
    operation: "PutItem",
    key: util.dynamodb.toMapValues({
      PK: `STORY#${util.autoId()}`,
      SK: "METADATA",
    }),
    attributeValues: util.dynamodb.toMapValues({
      ...input,
      authorId: identity.username,
      createdAt: util.time.nowISO8601(),
    }),
  };
}

export function response(ctx: CTX): Story {
  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type);
  }
  return ctx.result;
}
```
```

### **Phase 3: Frontend Application**

#### **Prompt 9 (Line 288-290) - GraphQL Client Setup**

**Issue:**
Says "Create a lib/api folder with typed API client functions that call the AppSync GraphQL API" but doesn't specify which GraphQL client to use or how to configure it.

**Fix Needed:**
```markdown
**GraphQL Client Setup:**

The monorepo uses AWS Amplify's GraphQL client. Configure in app/layout.tsx or lib/amplify.ts:

```typescript
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/api';

Amplify.configure({
  API: {
    GraphQL: {
      endpoint: process.env.NEXT_PUBLIC_APPSYNC_URL,
      region: process.env.NEXT_PUBLIC_AWS_REGION,
      defaultAuthMode: 'userPool',
    },
  },
  Auth: {
    Cognito: {
      userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID,
      userPoolClientId: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID,
      region: process.env.NEXT_PUBLIC_AWS_REGION,
    },
  },
});

export const client = generateClient();
```

**Using the GraphQL Client:**

```typescript
// lib/api/stories.ts
import { client } from '@/lib/amplify';
import { createStory } from '@/graphql/mutations';
import { getStory, listStories } from '@/graphql/queries';
import type { CreateStoryInput, Story } from '@/types/gqlTypes';

export async function createStoryAPI(input: CreateStoryInput): Promise<Story> {
  const result = await client.graphql({
    query: createStory,
    variables: { input },
  });
  return result.data.createStory;
}

export async function getStoryAPI(storyId: string): Promise<Story> {
  const result = await client.graphql({
    query: getStory,
    variables: { storyId },
  });
  return result.data.getStory;
}
```

**GraphQL Query/Mutation Definitions:**

Create graphql/ directory with operations:
- graphql/queries.ts
- graphql/mutations.ts
- graphql/subscriptions.ts

Example:
```typescript
// graphql/mutations.ts
export const createStory = /* GraphQL */ `
  mutation CreateStory($input: CreateStoryInput!) {
    createStory(input: $input) {
      storyId
      title
      synopsis
      authorId
      genre
      ageRating
      contentWarnings
      createdAt
    }
  }
`;
```

Note: The build-gql script generates TypeScript types in src/types/gqlTypes.ts from your GraphQL schema.
```

### **Missing Sections Needed**

#### **1. GraphQL Code Generation Setup**

Add after Prompt 1:

```markdown
### Prompt 1.5: GraphQL Code Generation Setup

Set up GraphQL code generation for the frontend:

1. **Create build-gql script** (frontend/scripts/buildGql.ts):
   - Merges all .graphql schema files from backend/schema/
   - Generates combined_schema.graphql
   - Runs graphql-codegen to create TypeScript types
   - Outputs to frontend/src/types/gqlTypes.ts

2. **Add to frontend/package.json**:
```json
{
  "scripts": {
    "build-gql": "ts-node -TP ../../../tsconfig.node.json ./scripts/buildGql.ts"
  }
}
```

3. **Run before development**:
   - yarn build-gql must run after any schema changes
   - Bootstrap script automatically runs this
   - Import types: `import { Story, User } from '@/types/gqlTypes'`

Follow the exact pattern from aws-example/frontend/scripts/buildGql.ts
```

#### **2. Deployment Configuration**

Add after Prompt 3:

```markdown
### Prompt 3.75: Deployment Configuration

Configure the Story Hub project in deploy/project-config.ts:

```typescript
[StackType.TheStoryHub]: {
  stackType: StackType.TheStoryHub,
  displayName: "The Story Hub",
  templateDir: "the-story-hub",
  packageDir: "the-story-hub",
  dependsOn: [StackType.WAF, StackType.Shared],
  buckets: {
    templates: "nlmonorepo-the-story-hub-templates-{stage}",
    frontend: "nlmonorepo-tsh-userfiles-{stage}",
    additional: ["nlmonorepo-{stage}-cfn-templates-{region}"],
  },
  hasFrontend: true,
  hasLambdas: true,
  hasResolvers: true,
  requiresAdminUser: true,
},
```

**Deployment Order:**
1. WAF Stack (us-east-1, provides CloudFront WAF)
2. Shared Stack (provides VPC, KMS, common resources)
3. The Story Hub Stack (your application)

**Deploy Commands:**
- Deploy all: `yarn deploy --stack the-story-hub --stage dev`
- Deploy dependencies automatically handled
```

## Summary of Changes Needed

1. **Update Tech Stack descriptions** - Clarify AppSync vs Lambda usage
2. **Fix schema file locations** - backend/schema/ directory, not single file
3. **Add build process documentation** - How schemas are merged and types generated
4. **Add GraphQL client setup** - AWS Amplify configuration
5. **Add resolver compilation info** - How TypeScript resolvers are built and deployed
6. **Add deployment configuration** - project-config.ts setup
7. **Add code generation setup** - build-gql script documentation
8. **Fix all REST endpoint references** - Already done ✓
9. **Add AppSync-specific patterns** - @aws_cognito_user_pools directives, ctx.identity usage
10. **Add subscription patterns** - Real-time updates via AppSync subscriptions
