# The `types/` directory in backend has been checked and is empty. It can be safely deleted.
# The following files are now obsolete and will be removed as part of cleanup:
# - GetCWLUser.graphql
# - scripts/buildGql.ts
# Cleanup (October 2025)

* `.graphqlconfig.yml` and `scripts/buildGql.ts` are no longer needed for type generation.
* Backend resolvers import types from the frontend (`frontend/src/types/gqlTypes.ts`).
* The `types/` directory in backend can be removed if empty.
* Remove `GetCWLUser.graphql` if it was only used for backend codegen.
# CloudWatch Live Backend

This directory contains the AWS CloudFormation templates and infrastructure definitions for the CloudWatch Live backend. The backend provides a serverless GraphQL API using AWS AppSync with Lambda resolvers, DynamoDB for data storage, and Cognito for authentication.

## 🎯 Overview

The CloudWatch Live backend provides:

- **GraphQL API** via AWS AppSync for real-time data access
- **Lambda resolvers** for custom business logic
- **DynamoDB tables** for user data and application state
- **Cognito integration** for user authentication and authorization
- **Real-time subscriptions** for live log streaming
- **Role-based access control** with multi-tenant support

## 🏗️ Architecture

### Core Components

- **AppSync API**: GraphQL endpoint with real-time subscriptions
- **Lambda Functions**: Custom resolvers for complex operations
- **DynamoDB Tables**: User data, organizations, and application state
- **Cognito User Pool**: Authentication and user management
- **CloudFormation**: Infrastructure as Code with nested stacks

### Infrastructure Stack

The backend infrastructure is deployed as part of the main CloudWatch Live stack:

```
CloudWatch Live Stack (ap-southeast-2)
├── AppSync API
│   ├── GraphQL Schema
│   ├── Data Sources (DynamoDB, Lambda)
│   └── Resolvers (Direct and Lambda)
├── DynamoDB Tables
│   ├── User Table
│   └── Organization Table
├── Lambda Functions
│   ├── Custom Resolvers
│   └── Utility Functions
└── Cognito Resources
    ├── User Pool
    ├── User Pool Client
    └── Identity Pool
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

### Local Development

For backend development, you can:

1. **Test GraphQL schema changes** locally
2. **Develop Lambda functions** with local testing
3. **Update CloudFormation templates** with validation

```bash
# Validate CloudFormation templates
aws cloudformation validate-template --template-body file://cfn-template.yaml

# Build GraphQL schema
yarn build-gql

# Test Lambda functions locally (if configured)
yarn test
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
# 3. Deploy updated Lambda functions
# 4. Maintain existing data and configurations
```

## 📊 Infrastructure Details

### CloudFormation Templates

| Template | Description | Location |
|----------|-------------|----------|
| `cfn-template.yaml` | Main stack template | `/cfn-template.yaml` |
| `AppSync/appSync.yaml` | GraphQL API configuration | `/resources/AppSync/` |
| `DynamoDb/dynamodb.yaml` | Database tables | `/resources/DynamoDb/` |
| `Cognito/cognito.yaml` | Authentication setup | `/resources/Cognito/` |
| `S3/s3.yaml` | Storage buckets | `/resources/S3/` |
| `CloudFront/cloudfront.yaml` | CDN distribution | `/resources/CloudFront/` |

### Stack Outputs

The CloudWatch Live stack provides these outputs for other stacks and applications:

- **AppSync API Endpoint**: GraphQL API URL
- **Cognito User Pool ID**: For authentication
- **DynamoDB Table Names**: For data access
- **S3 Bucket Names**: For frontend deployment
- **CloudFront Distribution**: For content delivery

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
# - Lambda functions
# - DynamoDB tables
# - Cognito resources
# - S3 buckets and CloudFront distribution
```

## 🐛 Troubleshooting

### Common Backend Issues

#### GraphQL Schema Issues
- **Schema validation errors**: Ensure all GraphQL types and resolvers are properly defined
- **Resolver compilation**: Check that TypeScript resolvers compile successfully
- **S3 upload failures**: Verify S3 bucket permissions for resolver uploads

#### DynamoDB Issues
- **Table creation failures**: Check IAM permissions for DynamoDB operations
- **Data access errors**: Verify Cognito user groups have proper DynamoDB access policies
- **Export/import issues**: Ensure DynamoDB table names are properly exported from CloudFormation

#### Cognito Authentication Issues
- **User pool configuration**: Verify Cognito User Pool settings match frontend configuration
- **User group creation**: Check that all required user groups are created during deployment
- **Cross-stack references**: Ensure Cognito resources are properly exported for frontend use

#### Lambda Function Issues
- **Resolver execution errors**: Check CloudWatch logs for Lambda function errors
- **Permission issues**: Verify Lambda execution roles have necessary permissions
- **Compilation errors**: Ensure TypeScript resolvers compile without errors

### Monitoring and Debugging

1. **CloudWatch Logs**: Check Lambda function logs for runtime errors
2. **AppSync Console**: Use GraphQL playground to test queries and mutations
3. **DynamoDB Console**: Verify data is being written correctly to tables
4. **CloudFormation Events**: Review stack events for deployment issues

## 📚 Additional Resources

- [AWS AppSync Documentation](https://docs.aws.amazon.com/appsync/) - GraphQL API service
- [AWS Lambda Documentation](https://docs.aws.amazon.com/lambda/) - Serverless functions
- [Amazon DynamoDB Documentation](https://docs.aws.amazon.com/dynamodb/) - NoSQL database
- [Amazon Cognito Documentation](https://docs.aws.amazon.com/cognito/) - User authentication
