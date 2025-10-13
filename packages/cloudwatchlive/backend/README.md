# CloudWatch Live Backend

This directory contains the AWS CloudFormation templates and infrastructure definitions for the CloudWatch Live backend. The backend provides a serverless GraphQL API using AWS AppSync with JavaScript resolvers, DynamoDB for data storage, and Cognito for authentication.

## 🎯 Overview

The CloudWatch Live backend provides:

- **GraphQL API** via AWS AppSync for real-time data access
- **JavaScript resolvers** compiled from TypeScript for business logic
- **DynamoDB tables** for user data and application state
- **Cognito integration** for user authentication and authorization
- **Real-time subscriptions** for live data streaming
- **Role-based access control** with multi-tenant support

## 🏗️ Architecture

### Core Components

- **AppSync API**: GraphQL endpoint with real-time subscriptions
- **JavaScript Resolvers**: Direct DynamoDB operations (compiled from TypeScript)
- **DynamoDB Tables**: User data, events, organizations, and application state
- **Cognito User Pool**: Authentication and user management
- **CloudFormation**: Infrastructure as Code with nested stacks

### Infrastructure Stack

The backend infrastructure is deployed as part of the main CloudWatch Live stack:

```
CloudWatch Live Stack (ap-southeast-2)
├── AppSync API
│   ├── GraphQL Schema
│   ├── Data Sources (DynamoDB)
│   └── JavaScript Resolvers (compiled from TypeScript)
├── DynamoDB Tables
│   └── Data Table (unified table for all entities)
├── Cognito Resources
│   ├── User Pool
│   ├── User Pool Client
│   └── Identity Pool
└── CloudFront Distribution
    └── S3 Bucket (frontend assets)
```

## 📋 Prerequisites

Before deploying the CloudWatch Live backend, ensure you have:

1. **AWS CLI** configured with appropriate credentials
2. **Required IAM permissions** for CloudFormation, AppSync, Lambda, DynamoDB, Cognito, and S3
3. **Node.js 18+** and **Yarn** installed
4. **Dependency stacks deployed** (WAF and Shared Assets stacks)

## 🚀 Deployment

The backend is deployed as part of the comprehensive deployment process. **Use the main deployment tool rather than deploying the backend individually.**

### Recommended: Use Main Deployment Tool

```bash
# Deploy entire application (recommended)
cd packages/deploy
yarn deploy

# The deployment tool will:
# 1. Deploy WAF stack (us-east-1)
# 2. Deploy Shared Assets stack (ap-southeast-2)
# 3. Deploy CloudWatch Live stack with backend (ap-southeast-2)
# 4. Create admin user in Cognito and DynamoDB
# 5. Deploy frontend to S3 and CloudFront
```

### Alternative: Individual Backend Deployment

If you need to deploy just the backend infrastructure:

```bash
# Deploy CloudWatch Live stack only (requires dependencies)
cd packages/deploy
yarn deploy:cwl --stage dev
```

**Note**: This requires that the WAF and Shared Assets stacks are already deployed, as the CloudWatch Live stack depends on their outputs.

## 🔧 Development

### Creating a New API Endpoint

To add a new GraphQL API endpoint to CloudWatch Live, follow these steps:

#### 1. **Update the GraphQL Schema**

Add your new query or mutation to the schema:

```bash
# File: packages/cloudwatchlive/backend/schema/users.graphql
# Or create a new .graphql file for your domain
```

**Example - Adding a new Query:**

```graphql
type Query {
  getCWLUser(userId: ID!): CWLUser
  # Add your new query
  getEvent(eventId: ID!): Event
}

type Event {
  id: ID!
  name: String!
  description: String
  startDate: String!
}
```

**Example - Adding a new Mutation:**

```graphql
type Mutation {
  createCWLUser(input: CreateCWLUserInput!): CWLUser
  # Add your new mutation
  createEvent(input: CreateEventInput!): Event
}

input CreateEventInput {
  name: String!
  description: String
  startDate: String!
}
```

#### 2. **Generate TypeScript Types**

Run the GraphQL code generator to create TypeScript types:

```bash
# From the root of the monorepo
yarn build-gql
```

This generates types in `packages/cloudwatchlive/frontend/src/types/gqlTypes.ts`

#### 3. **Create the Resolver Function**

Create a new TypeScript resolver file in the appropriate directory:

**For Queries:**

```bash
# File: packages/cloudwatchlive/backend/resolvers/[domain]/Queries/Query.[queryName].ts
# Example: packages/cloudwatchlive/backend/resolvers/events/Queries/Query.getEvent.ts
```

**For Mutations:**

```bash
# File: packages/cloudwatchlive/backend/resolvers/[domain]/Mutations/Mutation.[mutationName].ts
# Example: packages/cloudwatchlive/backend/resolvers/events/Mutations/Mutation.createEvent.ts
```

**Example Resolver (Query.getEvent.ts):**

```typescript
import { util } from "@aws-appsync/utils";
import type { Context } from "@aws-appsync/utils";

export function request(ctx: Context) {
  const { eventId } = ctx.arguments;

  return {
    operation: "GetItem",
    key: util.dynamodb.toMapValues({ id: eventId }),
  };
}

export function response(ctx: Context) {
  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type);
  }
  return ctx.result;
}
```

**Example Resolver (Mutation.createEvent.ts):**

```typescript
import { util } from "@aws-appsync/utils";
import type { Context } from "@aws-appsync/utils";

export function request(ctx: Context) {
  const { input } = ctx.arguments;
  const id = util.autoId(); // Generate unique ID

  const item = {
    id,
    ...input,
    createdAt: util.time.nowISO8601(),
  };

  return {
    operation: "PutItem",
    key: util.dynamodb.toMapValues({ id }),
    attributeValues: util.dynamodb.toMapValues(item),
  };
}

export function response(ctx: Context) {
  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type);
  }
  return ctx.result;
}
```

#### 4. **Register the Resolver in CloudFormation**

Add the resolver resource to the AppSync CloudFormation template:

```bash
# File: packages/deploy/templates/cwl/resources/AppSync/appsync.yaml
```

**Example:**

```yaml
Resources:
  # ... existing resources ...

  GetEventResolver:
    Type: AWS::AppSync::Resolver
    Properties:
      ApiId: !GetAtt GraphQlApi.ApiId
      TypeName: Query
      FieldName: getEvent
      DataSourceName: !GetAtt MainTableDataSource.Name
      Kind: UNIT
      Runtime:
        Name: APPSYNC_JS
        RuntimeVersion: 1.0.0
      CodeS3Location: !Sub "s3://${TemplateBucketName}/resolvers/${Stage}/events/Queries/Query.getEvent.js"

  CreateEventResolver:
    Type: AWS::AppSync::Resolver
    Properties:
      ApiId: !GetAtt GraphQlApi.ApiId
      TypeName: Mutation
      FieldName: createEvent
      DataSourceName: !GetAtt MainTableDataSource.Name
      Kind: UNIT
      Runtime:
        Name: APPSYNC_JS
        RuntimeVersion: 1.0.0
      CodeS3Location: !Sub "s3://${TemplateBucketName}/resolvers/${Stage}/events/Mutations/Mutation.createEvent.js"
```

#### 5. **Add Resolver to Deployment List**

Update the deployment configuration to include your new resolver:

```bash
# File: packages/deploy/packages/cwl/cwl.ts
```

Find the `resolverFiles` array and add your new resolver paths:

```typescript
const resolverFiles = [
  "users/Queries/Query.getCWLUser.ts",
  "users/Mutations/Mutation.createCWLUser.ts",
  // Add your new resolvers
  "events/Queries/Query.getEvent.ts",
  "events/Mutations/Mutation.createEvent.ts",
];
```

#### 6. **Deploy the Changes**

Deploy your changes to AWS:

```bash
cd packages/deploy
yarn deploy
```

The deployment process will:

1. Upload the updated schema to S3
2. Compile your TypeScript resolvers to JavaScript
3. Upload compiled resolvers to S3
4. Update the CloudFormation stack with new resolver resources

#### 7. **Use the New Endpoint in Frontend**

Import the generated types and use them in your React components:

```typescript
// Import generated types
import { GetEventQuery, CreateEventMutation } from "@/types/gqlTypes";
import { generateClient } from "aws-amplify/api";

const client = generateClient();

// Query example
const getEvent = async (eventId: string) => {
  const response = await client.graphql({
    query: `
      query GetEvent($eventId: ID!) {
        getEvent(eventId: $eventId) {
          id
          name
          description
          startDate
        }
      }
    `,
    variables: { eventId },
  });
  return response.data.getEvent;
};

// Mutation example
const createEvent = async (input: CreateEventInput) => {
  const response = await client.graphql({
    query: `
      mutation CreateEvent($input: CreateEventInput!) {
        createEvent(input: $input) {
          id
          name
          description
          startDate
        }
      }
    `,
    variables: { input },
  });
  return response.data.createEvent;
};
```

#### Key Files Summary

| File                                                                                  | Purpose                                        |
| ------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `packages/cloudwatchlive/backend/schema/users.graphql`                                | GraphQL schema operations (queries, mutations) |
| `packages/shared/types/[TypeName].graphql`                                            | GraphQL type definitions                       |
| `packages/cloudwatchlive/backend/resolvers/[domain]/[type]/[TypeName].[fieldName].ts` | Resolver implementation                        |
| `packages/deploy/templates/cwl/resources/AppSync/appsync.yaml`                        | CloudFormation resolver registration           |
| `packages/deploy/packages/cwl/cwl.ts`                                                 | Deployment configuration                       |

#### Tips

- **Organize by domain**: Group related resolvers in directories (e.g., `users/`, `events/`, `sessions/`)
- **Use TypeScript types**: Import types from `gqlTypes.ts` for type safety
- **Test in AppSync Console**: Use the GraphQL playground to test queries/mutations before frontend integration
- **Error handling**: Always handle errors in both `request` and `response` functions
- **Authentication**: Use `ctx.identity` to access the authenticated user's information
- **Importing constants**: You can import from `packages/cloudwatchlive/backend/constants/` in your resolvers

### Local Development

For backend development, you can:

1. **Test GraphQL schema changes** locally
2. **Develop TypeScript resolvers** with type safety
3. **Update CloudFormation templates** with validation

```bash
# Validate CloudFormation templates
aws cloudformation validate-template --template-body file://cfn-template.yaml

# Build GraphQL types from schema
yarn build-gql

# Compile TypeScript resolvers (done automatically during deployment)
cd ../../deploy
yarn deploy
```

### Backend Updates

To update the backend infrastructure:

```bash
# Update CloudWatch Live stack
cd packages/deploy
yarn update:cwl --stage dev

# This will:
# 1. Deploy updated CloudFormation templates
# 2. Update AppSync schema and resolvers
# 3. Compile and upload updated TypeScript resolvers
# 4. Maintain existing data and configurations
```

## 📊 Infrastructure Details

### CloudFormation Templates

| Template                     | Description               | Location                 |
| ---------------------------- | ------------------------- | ------------------------ |
| `AppSync/appsync.yaml`       | GraphQL API configuration | `/resources/AppSync/`    |
| `DynamoDb/dynamoDb.yaml`     | Database tables           | `/resources/DynamoDb/`   |
| `Cognito/cognito.yaml`       | Authentication setup      | `/resources/Cognito/`    |
| `S3/s3.yaml`                 | Storage buckets           | `/resources/S3/`         |
| `CloudFront/cloudfront.yaml` | CDN distribution          | `/resources/CloudFront/` |
| `Lambda/lambda.yaml`         | Post-deployment functions | `/resources/Lambda/`     |

### Stack Outputs

The CloudWatch Live stack provides these outputs for other stacks and applications:

- **AppSync API Endpoint**: GraphQL API URL
- **AppSync API ID**: For configuration and monitoring
- **Cognito User Pool ID**: For authentication
- **Cognito User Pool Client ID**: For frontend authentication
- **Cognito Identity Pool ID**: For AWS service access
- **DynamoDB Table Name**: For data access
- **S3 Bucket Name**: For frontend deployment
- **CloudFront Distribution ID**: For cache invalidation
- **CloudFront Domain**: For content delivery

### Dependencies

The backend stack depends on outputs from:

- **WAF Stack**: Web Application Firewall ACL ID
- **Shared Assets Stack**: VPC, KMS keys, shared resources

## 🗑️ Resource Removal

The backend resources are removed as part of the complete stack removal process:

```bash
# Remove all stacks (recommended)
cd packages/deploy
yarn remove

# The tool will:
# 1. Remove CloudWatch Live stack (includes backend)
# 2. Remove Shared Assets stack
# 3. Remove WAF stack
# 4. Handle dependency order automatically
```

### Individual Backend Removal (Advanced)

To remove just the CloudWatch Live stack (including backend):

```bash
# Remove CloudWatch Live stack only
cd packages/deploy
yarn remove:cwl --stage dev

# This removes:
# - AppSync API and resolvers
# - DynamoDB tables
# - Cognito resources
# - S3 buckets and CloudFront distribution
# - Lambda post-deployment functions
```

## 🐛 Troubleshooting

### Common Backend Issues

#### GraphQL Schema Issues

- **Schema validation errors**: Ensure all GraphQL types and resolvers are properly defined
- **Resolver compilation**: Check that TypeScript resolvers compile successfully
- **S3 upload failures**: Verify S3 bucket permissions for resolver uploads

#### DynamoDB Issues

- **Table creation failures**: Check IAM permissions for DynamoDB operations
- **Data access errors**: Verify AppSync data source role has proper DynamoDB access policies
- **Export/import issues**: Ensure DynamoDB table names are properly exported from CloudFormation

#### Cognito Authentication Issues

- **User pool configuration**: Verify Cognito User Pool settings match frontend configuration
- **User group creation**: Check that all required user groups are created during deployment
- **Identity Pool**: Ensure Identity Pool is properly configured with User Pool as provider
- **Cross-stack references**: Ensure Cognito resources are properly exported for frontend use

#### Resolver Issues

- **Compilation errors**: Check TypeScript resolver code for syntax errors
- **Runtime errors**: Check AppSync logs in CloudWatch for resolver execution errors
- **Permission issues**: Verify AppSync data source roles have necessary permissions
- **Type mismatches**: Ensure resolver types match GraphQL schema definitions

### Monitoring and Debugging

1. **CloudWatch Logs**: Check AppSync logs for resolver execution errors
2. **AppSync Console**: Use GraphQL playground to test queries and mutations
3. **DynamoDB Console**: Verify data is being written correctly to tables
4. **CloudFormation Events**: Review stack events for deployment issues
5. **Resolver Logs**: Enable field-level logging in AppSync for detailed debugging

## 📚 Additional Resources

- [AWS AppSync Documentation](https://docs.aws.amazon.com/appsync/) - GraphQL API service
- [AppSync JavaScript Resolvers](https://docs.aws.amazon.com/appsync/latest/devguide/resolver-reference-overview-js.html) - Resolver reference
- [Amazon DynamoDB Documentation](https://docs.aws.amazon.com/dynamodb/) - NoSQL database
- [Amazon Cognito Documentation](https://docs.aws.amazon.com/cognito/) - User authentication

## SES Sandbox Email Verification

If you are using AWS SES in sandbox mode (the default for new AWS accounts):

- **The from address must be verified** in SES. The deployment will automatically send a verification email if needed.
- **The to address (recipient) must also be verified** in SES. You can only send emails to verified addresses in sandbox mode.
- After clicking the verification link in your email, you do NOT need to re-deploy. The Lambda will work immediately for verified addresses.
- To move out of sandbox mode, request production access in the AWS SES console.
