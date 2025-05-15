# Shared AWS Assets

This package contains the AWS CloudFormation templates and deployment scripts for shared AWS resources used across multiple applications in the mono-repo.

## Overview

Shared AWS Assets provides a set of common AWS resources including:

- Cognito User Pools for Authentication
- DynamoDB tables for common data
- KMS for encryption keys
- S3 buckets for shared storage
- VPC networking resources

## Configuration Management

During deployment, this package exports CloudFormation outputs to `/packages/shared/config/cloudformation-outputs.json`. This file is the central configuration store for all packages and includes:

- Cognito User Pool IDs
- DynamoDB Table ARNs
- AppSync GraphQL URLs
- Other stage-specific configurations

When redeploying this package, it will only update its own stage-specific outputs while preserving other configurations in the file.

## Deployment Prerequisites

Before deploying Shared AWS Assets, make sure you have:

1. AWS CLI configured with appropriate credentials
2. Required IAM permissions (defined in `initial-deployment-policy.json`)
3. Node.js and Yarn installed
4. The WAF stack deployed (see deployment flow below)

## Deployment Options

You can deploy the shared AWS assets in multiple ways:

### Option 1: Deploy All Stacks from Root (Recommended)

The recommended approach is to use the root-level script that deploys all stacks in the correct order:

```bash
# Navigate to the root of the mono-repo
cd /home/liqk1ugzoezh5okwywlr_/dev/nl-mono-repo 

# Deploy all stacks
STAGE=dev yarn deploy-all
```

This script handles the correct deployment order and dependencies.

### Option 2: Deploy Individual Services

If you need to deploy components individually:

#### 1. Deploy Web Application Firewall first
```bash
cd /home/liqk1ugzoezh5okwywlr_/dev/nl-mono-repo/packages/cwl-waf && STAGE=dev AWS_PROFILE=nlmonorepo-waf-dev yarn deploy-waf
```

#### 2. Deploy Shared Assets
```bash
cd /home/liqk1ugzoezh5okwywlr_/dev/nl-mono-repo/packages/shared-aws-assets && STAGE=dev AWS_PROFILE=nlmonorepo-shared-dev yarn deploy-shared
```

## Deployment Process Details

The Shared AWS Assets deployment process:

1. Validates CloudFormation templates
2. Deploys the main CloudFormation stack
3. Creates resources using nested stacks for:
   - Cognito
   - DynamoDB
   - KMS
   - S3
   - VPC

## Resource Removal

You have two options to remove the deployed resources:

### Option 1: Remove All Stacks from Root (Recommended)

```bash
# Navigate to the root of the mono-repo
cd /home/liqk1ugzoezh5okwywlr_/dev/nl-mono-repo 

# Remove all stacks
STAGE=dev yarn remove-all
```

### Option 2: Remove Individual Services

Execute these commands in proper order (after removing any dependent services):

#### 1. Remove Shared Assets
```bash
STAGE=dev AWS_PROFILE=nlmonorepo-shared-dev yarn remove-shared
```

## Available Scripts

- `yarn build-gql`: Build GraphQL schema
- `yarn deploy-shared`: Deploy shared AWS assets
- `yarn remove-shared`: Remove shared AWS assets

## Important Notes

- Before removing shared resources, ensure that no other services depend on them
- Removing shared resources can cause data loss for applications using these resources
- For production environments, ensure you have appropriate backups in place
