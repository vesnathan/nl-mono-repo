# CloudWatchLive Deployment

This directory contains the AWS CloudFormation templates and deployment scripts for the CloudWatchLive backend infrastructure. The deployment now uses a nested stack approach to improve stability and resolve S3 access denied errors.

## Deployment Prerequisites

Before deploying CloudWatchLive, make sure you have:

1. AWS CLI configured with appropriate credentials
2. Required IAM permissions (see below)
3. Node.js and Yarn installed
4. The shared-aws-assets stack deployed (see deployment flow below)

## Required IAM Permissions

To deploy CloudWatchLive, you'll need sufficient IAM permissions. The updated deployment policy now includes permissions for:

- CloudFormation
- IAM
- EC2
- Cognito
- KMS
- DynamoDB
- S3
- AppSync
- CloudFront
- Lambda

1. Create IAM users with the following profiles:
   - `nlmonorepo-waf-dev` - For WAF deployment
   - `nlmonorepo-shared-dev` - For shared assets deployment
   - `nlmonorepo-cwl-dev` - For CloudWatchLive deployment
2. Create policies using the respective JSON files and attach them to the users
3. Configure your AWS CLI to use these profiles

## Deployment Flow

The recommended deployment order is:

### 1. Deploy Web Application Firewall
```bash
cd /home/liqk1ugzoezh5okwywlr_/dev/nl-mono-repo/packages/cwl-waf && STAGE=dev AWS_PROFILE=nlmonorepo-waf-dev yarn deploy-waf
```

### 2. Deploy Shared Assets

```bash
cd /home/liqk1ugzoezh5okwywlr_/dev/nl-mono-repo/packages/shared-aws-assets && STAGE=dev AWS_PROFILE=nlmonorepo-shared-dev yarn deploy-shared
```

### 3. Deploy CloudWatchLive Backend

```bash
cd /home/liqk1ugzoezh5okwywlr_/dev/nl-mono-repo/packages/cloudwatchlive/backend && STAGE=dev AWS_PROFILE=nlmonorepo-cwl-dev yarn deploy
```

### 4. Run Post-Deployment Setup (User Creation)

```bash
cd /home/liqk1ugzoezh5okwywlr_/dev/nl-mono-repo/packages/cloudwatchlive/backend && STAGE=dev AWS_PROFILE=nlmonorepo-cwl-dev yarn post-deploy
```

Alternatively, you can run both the deployment and post-deployment setup in one command:

```bash
cd /home/liqk1ugzoezh5okwywlr_/dev/nl-mono-repo/packages/cloudwatchlive/backend && STAGE=dev AWS_PROFILE=nlmonorepo-cwl-dev yarn deploy-full
```

This will create a test user with:
- Email: vesnathan@gmail.com
- First Name: John
- Last Name: Doe
- Password: Temp1234!

## Deployment Process Details

The CloudWatchLive deployment process:

1. Creates an S3 bucket for storing CloudFormation templates
2. Validates all template files for syntax errors
3. Uploads template files to the S3 bucket
4. Deploys the main CloudFormation stack
5. Creates nested stacks for each resource type:
   - DynamoDB tables
   - S3 bucket for frontend assets
   - CloudFront distribution
   - AppSync API
   - Lambda functions
6. Post-deployment creates a test user in Cognito and DynamoDB

## Resource Removal

To remove all deployed resources, execute these commands in reverse order:

### 1. Remove CloudWatchLive Backend

```bash
cd /home/liqk1ugzoezh5okwywlr_/dev/nl-mono-repo/packages/cloudwatchlive/backend && STAGE=dev AWS_PROFILE=nlmonorepo-cwl-dev yarn remove-cwl
```

### 2. Remove Shared Assets (only if no other services depend on it)

```bash
cd /home/liqk1ugzoezh5okwywlr_/dev/nl-mono-repo/packages/shared-aws-assets && STAGE=dev AWS_PROFILE=nlmonorepo-shared-dev yarn remove-shared
```

### 3. Remove WAF (if deployed)

```bash
cd /home/liqk1ugzoezh5okwywlr_/dev/nl-mono-repo/packages/cwl-waf && STAGE=dev AWS_PROFILE=nlmonorepo-waf-dev yarn remove-waf
```

## Common Issues and Troubleshooting

- **Access Denied Errors**: Make sure the IAM user has all required permissions. Check `cwl-deployment-policy.json` for the full list of needed permissions.
- **Stack in ROLLBACK state**: Use `yarn remove-cwl` to delete the failed stack before attempting to redeploy.
- **S3 Access Errors**: The bucket naming may cause conflicts. If you see S3 access errors, the new deployment process using nested stacks should resolve these issues.
- **Cognito User Setup**: The post-deployment script creates a user with email: vesnathan@gmail.com and password: Temp1234!. If user creation fails, you can run the post-deploy script separately.
