## Getting Started

Install dependencies:  
After cloning repo, run "yarn" from root. Lerna will go through all workspaces listed in package.json in root and install dependencies  

## Deployment Options

For a complete overview of all deployment options, see [DEPLOYMENT-OPTIONS.md](DEPLOYMENT-OPTIONS.md).

### Option 1: Simplified One-Command CloudFormation Deployment (Recommended)

This approach offers the simplest way to deploy the entire application with just your AWS access key and secret key. It:
1. Creates all necessary IAM resources using CloudFormation
2. Configures AWS profiles automatically
3. Deploys all application stacks in the correct order

```bash
# Run the CloudFormation one-command deployment script
chmod +x ./scripts/cfn-one-deploy.sh
./scripts/cfn-one-deploy.sh
```

You'll be prompted for:
- Your AWS access key ID and secret access key
- The deployment stage (dev, staging, or prod)

The script handles everything else automatically, including IAM setup and application deployment.

> **Note on AWS IAM Permissions**:  
> To deploy using this method, you'll need specific IAM permissions to create and manage IAM resources:  
> - cloudformation:* (to create and manage CloudFormation stacks)  
> - Various IAM permissions (iam:GetUser, iam:CreateUser, iam:CreateRole, etc.)  
> 
> If you encounter "AccessDenied" or "not authorized to perform: iam:*" errors, you have these options:  
> 1. Request the necessary IAM permissions from your AWS administrator  
> 2. Use a different AWS user with administrator access  
> 3. Continue with the script which will offer guidance for handling permission issues  
>  
> See [CFN_DEPLOYMENT_INSTRUCTIONS.md](CFN_DEPLOYMENT_INSTRUCTIONS.md) for a complete list of required permissions.

### Option 2: Secure Deployment with AWS STS

For production and secure deployments, you can manually set up AWS Security Token Service (STS) to create temporary credentials. This approach uses IAM roles with least privilege principles.

See the [AWS STS Deployment Guide](AWS-STS-GUIDE.md) for detailed instructions on setting up and using STS for deployments.

## Deploy Stacks Manually

You can deploy all stacks at once or deploy them individually. The deployment order is important: WAF → Shared AWS Assets → CloudWatchLive Backend.

> **Note**: This project uses a multi-region deployment approach:
> - WAF stack is deployed in **us-east-1** (North Virginia)
> - Shared Assets and CloudWatchLive stacks are deployed in **ap-southeast-2** (Sydney)

### Deploy All Stacks at Once

The recommended way to deploy all stacks is using the root-level script:

```bash
# Deploy all stacks with default profiles
STAGE=dev yarn deploy-all

# Deploy with custom AWS profiles
STAGE=dev AWS_PROFILE_WAF=your-waf-profile AWS_PROFILE_SHARED=your-shared-profile AWS_PROFILE_CWL=your-cwl-profile yarn deploy-all
```

This script will:
1. Deploy the WAF stack in us-east-1
2. Deploy the Shared AWS Assets stack in ap-southeast-2
3. Deploy the CloudWatchLive Backend stack in ap-southeast-2
4. Run the post-deployment setup to create a test user

### Deploy Individual Stacks

If you prefer deploying stacks individually, use the following commands in this order:

#### 1. Deploy Web Application Firewall (WAF) in us-east-1
```bash
cd packages/cwl-waf && STAGE=dev AWS_PROFILE=nlmonorepo-waf-dev AWS_REGION=us-east-1 yarn deploy-waf
```

#### 2. Deploy Shared AWS Assets in ap-southeast-2
```bash
cd packages/shared-aws-assets && STAGE=dev AWS_PROFILE=nlmonorepo-shared-dev AWS_REGION=ap-southeast-2 yarn deploy-shared
```

#### 3. Deploy CloudWatchLive Backend in ap-southeast-2
```bash
cd packages/cloudwatchlive/backend && STAGE=dev AWS_PROFILE=nlmonorepo-cwl-dev AWS_REGION=ap-southeast-2 yarn deploy
```

#### 4. Create Test User
```bash
cd packages/cloudwatchlive/backend && STAGE=dev AWS_PROFILE=nlmonorepo-cwl-dev AWS_REGION=ap-southeast-2 yarn post-deploy
```

This will create a user with the following details:
- Email: vesnathan@gmail.com
- First Name: John
- Last Name: Doe
- Password: Temp1234!  

   
## Launch dev site  
Run:  
&nbsp;yarn dev-cwl  
  
## Remove Stacks

You can remove all stacks at once or remove them individually. The removal order is important (reverse of deployment): CloudWatchLive Backend → Shared AWS Assets → WAF.

> **Note**: Remember that stacks are deployed in different regions:
> - CloudWatchLive Backend and Shared Assets are in **ap-southeast-2** (Sydney)
> - WAF stack is in **us-east-1** (North Virginia)

### Remove All Stacks at Once

The recommended way to remove all stacks is using the root-level script:

```bash
# Remove all stacks with default profiles
STAGE=dev yarn remove-all

# Remove with custom AWS profiles
STAGE=dev AWS_PROFILE_WAF=your-waf-profile AWS_PROFILE_SHARED=your-shared-profile AWS_PROFILE_CWL=your-cwl-profile yarn remove-all
```

### Remove Individual Stacks

If you prefer removing stacks individually, use the following commands in this order:

#### 1. Remove CloudWatchLive Backend (ap-southeast-2)
```bash
cd packages/cloudwatchlive/backend && STAGE=dev AWS_PROFILE=nlmonorepo-cwl-dev AWS_REGION=ap-southeast-2 yarn remove-cwl
```

#### 2. Remove Shared AWS Assets (ap-southeast-2)
```bash
cd packages/shared-aws-assets && STAGE=dev AWS_PROFILE=nlmonorepo-shared-dev AWS_REGION=ap-southeast-2 yarn remove-shared
```

#### 3. Remove Web Application Firewall (WAF) (us-east-1)
```bash
cd packages/cwl-waf && STAGE=dev AWS_PROFILE=nlmonorepo-waf-dev AWS_REGION=us-east-1 yarn remove-waf
```


