# Shared AWS Assets

This package contains the AWS CloudFormation templates and infrastructure definitions for shared resources used across the CloudWatch Live application. These resources provide the foundational infrastructure that other application stacks depend on.

## 🎯 Overview

Shared AWS Assets provides foundational infrastructure including:

- **VPC and Networking**: Virtual Private Cloud setup with subnets and security groups
- **KMS Keys**: Encryption keys for securing data at rest and in transit
- **IAM Roles**: Service roles and policies for stack deployments
- **S3 Buckets**: Shared storage buckets for templates and assets
- **CloudFormation Exports**: Shared outputs for other stacks to reference

## 🏗️ Architecture

The shared assets serve as the foundation layer for the entire application:

```
Shared Assets Stack (ap-southeast-2)
├── VPC & Networking
│   ├── Public/Private Subnets
│   ├── Internet Gateway
│   └── Security Groups
├── KMS Keys
│   ├── Application Data Encryption
│   └── S3 Bucket Encryption
├── IAM Resources
│   ├── CloudFormation Service Roles
│   └── Cross-Stack Access Policies
└── S3 Buckets
    ├── Template Storage
    └── Asset Storage
```

## 📋 Prerequisites

Before deploying Shared AWS Assets, ensure you have:

1. **AWS CLI** configured with appropriate credentials
2. **Required IAM permissions** for CloudFormation, VPC, KMS, S3, and IAM services
3. **Node.js 18+** and **Yarn** installed
4. **WAF stack deployed** (dependency requirement)

## 🚀 Deployment

The shared assets are deployed as part of the comprehensive deployment process. **Use the main deployment tool rather than deploying shared assets individually.**

### Recommended: Use Main Deployment Tool

```bash
# Deploy entire application (recommended)
cd packages/deploy
yarn deploy

# The deployment tool automatically:
# 1. Deploys WAF stack first (us-east-1)
# 2. Deploys Shared Assets stack (ap-southeast-2)
# 3. Deploys CloudWatch Live stack (ap-southeast-2)
# 4. Handles all dependencies and exports/imports
```

### Alternative: Individual Shared Assets Deployment

If you need to deploy or update just the shared assets:

```bash
# Update shared assets and dependent stacks
cd packages/deploy
yarn update:shared --stage dev

# This will:
# 1. Update the Shared Assets stack
# 2. Prompt to update the dependent CloudWatch Live stack
# 3. Handle all CloudFormation exports/imports
```

**Note**: The shared assets stack depends on the WAF stack being deployed first, as it references WAF outputs.

## 🔧 Development

### Infrastructure Updates

To update the shared infrastructure:

```bash
# Update shared assets with dependency management
cd packages/deploy
yarn update:shared --stage dev

# The tool will:
# 1. Update the Shared Assets CloudFormation stack
# 2. Detect dependent stacks (CloudWatch Live)
# 3. Prompt to update dependent stacks if needed
# 4. Handle all exports/imports automatically
```

### CloudFormation Templates

The shared assets are defined in CloudFormation templates:

| Template | Description | Location |
|----------|-------------|----------|
| `cfn-template.yaml` | Main stack template | `/cfn-template.yaml` |
| `resources/` | Nested stack templates | `/resources/` |

### Stack Exports

The Shared Assets stack provides these exports for other stacks:

- **VPC Configuration**: VPC ID, subnet IDs, security group IDs
- **KMS Keys**: Encryption key ARNs for application use
- **S3 Buckets**: Shared bucket names and ARNs
- **IAM Roles**: Service role ARNs for cross-stack access

## 📊 Infrastructure Details

### Dependencies

- **Depends on**: WAF Stack (for WAF ACL references)
- **Depended on by**: CloudWatch Live Stack (for VPC, KMS, etc.)

### Regional Configuration

- **Deployment Region**: `ap-southeast-2` (Sydney)
- **Cross-Region References**: References WAF resources from `us-east-1`

### Resource Management

The shared assets include:

1. **Networking Layer**: VPC, subnets, security groups, and routing
2. **Security Layer**: KMS keys for encryption, IAM roles for access
3. **Storage Layer**: S3 buckets for templates and shared assets
4. **Integration Layer**: CloudFormation exports for cross-stack references

## 🗑️ Resource Removal

Shared assets should be removed as part of the complete stack removal process:

```bash
# Remove all stacks (recommended)
cd packages/deploy
yarn remove

# The tool will:
# 1. Remove CloudWatch Live stack first (dependent)
# 2. Remove Shared Assets stack second
# 3. Remove WAF stack last
# 4. Handle dependency order automatically
```

### Individual Removal (Advanced)

Only remove shared assets individually if you're certain no other stacks depend on them:

```bash
# Remove shared assets only (advanced users)
cd packages/deploy
yarn remove:shared --stage dev

# WARNING: This will fail if CloudWatch Live stack still exists
```

## 🛠️ Available Commands

When working directly with this package (advanced usage):

```bash
# Build GraphQL schema (if applicable)
yarn build-gql

# Validate CloudFormation templates
aws cloudformation validate-template --template-body file://cfn-template.yaml
```

## ⚠️ Important Notes

- **Dependency Management**: Always use the main deployment tool to handle dependencies
- **Data Persistence**: Removing shared resources can cause data loss for dependent applications
- **Production Safety**: Ensure proper backups exist before removing production shared assets
- **Regional Consistency**: Shared assets are deployed in `ap-southeast-2` and reference WAF resources from `us-east-1`

## 🐛 Troubleshooting

### Common Issues

#### Deployment Failures
- **Missing WAF dependency**: Ensure WAF stack is deployed first
- **Permission errors**: Verify AWS credentials have all required permissions
- **Export conflicts**: Check for naming conflicts with existing CloudFormation exports

#### Update Issues
- **Dependent stack failures**: If updating shared assets breaks dependent stacks, use the main deployment tool's update functionality
- **Resource constraints**: Some resources (like VPC configurations) have limitations on updates

### Getting Help

1. Check the [main deployment documentation](../deploy/README.md) for comprehensive troubleshooting
2. Review CloudFormation stack events in the AWS Console for detailed error information
3. Verify all dependencies are properly deployed before updating shared assets
