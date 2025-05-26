# CloudWatch Live Deployment Tool

This package contains the deployment scripts for the CloudWatch Live application stack.

## Prerequisites

- Node.js 18+
- AWS CLI configured or environment variables set
- Appropriate AWS permissions for CloudFormation, S3, Cognito, and other services

## Installation

```bash
cd packages/deploy
npm install
```

## Environment Variables

Create a `.env` file in the deploy package directory with:

```bash
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_ACCOUNT_ID=your_12_digit_account_id
```

## Usage

### Interactive Mode

Run without arguments for interactive mode:

```bash
npm run deploy
```

### Deploy All Stacks

Deploy all stacks in the correct order (WAF → Shared → CWL):

```bash
npm run deploy all --stage dev --admin-email admin@example.com
```

### Deploy Specific Package

```bash
# Deploy WAF stack
npm run deploy:waf

# Deploy shared resources
npm run deploy:shared

# Deploy CloudWatch Live application
npm run deploy:cwl
```

### Update Stack with Dependencies

```bash
# Update shared stack and redeploy CWL (which depends on shared)
npm run update:shared

# Update WAF stack only (no dependencies)
npm run update:waf

# Update CWL stack only (no dependents)
npm run update:cwl
```

### Frontend Deployment

```bash
# Full frontend deployment (build + upload + invalidate)
npm run deploy:frontend

# Individual frontend commands
npm run frontend:build
npm run frontend:upload
npm run frontend:invalidate
```

## Options

- `--stage <stage>`: Deployment stage (dev, staging, prod). Default: `dev`
- `--package <package>`: Deploy specific package (waf, shared, cwl)
- `--admin-email <email>`: Admin user email for Cognito user creation
- `--skip-user-creation`: Skip admin user creation during deployment
- `--no-auto-delete`: Disable auto-deletion of failed stacks
- `--aws-region <region>`: AWS Region. Default: `ap-southeast-2`

## Environment Variables

- `ADMIN_EMAIL`: Admin user email (alternative to --admin-email option)
- `AWS_REGION`: AWS Region (alternative to --aws-region option)
- `AWS_ACCESS_KEY_ID`: AWS Access Key ID
- `AWS_SECRET_ACCESS_KEY`: AWS Secret Access Key

## Admin User Creation

During a full deployment, the system will automatically create an admin user in Cognito and DynamoDB with the following details:

- **Email**: Specified via `--admin-email` option or `ADMIN_EMAIL` environment variable
- **Password**: `Temp1234!` (must be changed on first login)
- **Groups**: SuperAdmin
- **Default Profile**: John Doe, Mr, 0421 569 854

The user creation process:
1. Creates required Cognito user groups (SuperAdmin, Admin, User)
2. Creates the user in Cognito User Pool
3. Sets a permanent password
4. Adds the user to the SuperAdmin group
5. Creates a user record in the DynamoDB user table
6. Validates the user creation

## Troubleshooting

### User Creation Issues

If user creation fails during deployment, you can:
1. Check the AWS credentials have appropriate permissions
2. Verify the Cognito User Pool and DynamoDB table exist
3. Check the CloudFormation stack outputs for correct resource names

### Failed Stack Recovery

Failed stacks are automatically deleted and redeployed by default. To disable this behavior, use the `--no-auto-delete` option.

## Architecture

The deployment follows this order:
1. **WAF Stack** (us-east-1): Web Application Firewall resources
2. **Shared Stack** (ap-southeast-2): Cognito, DynamoDB, and shared resources
3. **CWL Stack** (ap-southeast-2): CloudWatch Live application resources
4. **User Creation**: Admin user setup in Cognito and DynamoDB

## Examples

### Basic Development Deployment
```bash
# Deploy everything for dev environment
npm run deploy all --stage dev --admin-email dev-admin@company.com
```

### Updating Just the Shared Stack (Most Common Scenario)
```bash
# Update shared stack and automatically redeploy CWL stack
npm run update:shared --stage dev

# This is equivalent to:
# 1. Deploy shared stack
# 2. Deploy CWL stack (since it depends on shared)
```

### Production Deployment
```
