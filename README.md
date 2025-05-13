## Getting Started

Install dependencies:  
After cloning repo, run "yarn" from root. Lerna will go through all workspaces listed in package.json in root and install dependencies  

## Deploy Stacks

You can deploy all stacks at once or deploy them individually. The deployment order is important: WAF → Shared AWS Assets → CloudWatchLive Backend.


### Deploy All Stacks at Once

The recommended way to deploy all stacks is using the root-level script:

```bash
# Deploy all stacks with default profiles
STAGE=dev yarn deploy-all

# Deploy with custom AWS profiles
STAGE=dev AWS_PROFILE_WAF=your-waf-profile AWS_PROFILE_SHARED=your-shared-profile AWS_PROFILE_CWL=your-cwl-profile yarn deploy-all
```

This script will:
1. Deploy the WAF stack
2. Deploy the Shared AWS Assets stack
3. Deploy the CloudWatchLive Backend stack
4. Run the post-deployment setup to create a test user

### Deploy Individual Stacks

If you prefer deploying stacks individually, use the following commands in this order:

#### 1. Deploy Web Application Firewall (WAF)
```bash
cd packages/cwl-waf && STAGE=dev AWS_PROFILE=nlmonorepo-waf-dev yarn deploy-waf
```

#### 2. Deploy Shared AWS Assets
```bash
cd packages/shared-aws-assets && STAGE=dev AWS_PROFILE=nlmonorepo-shared-dev yarn deploy-shared
```

#### 3. Deploy CloudWatchLive Backend
```bash
cd packages/cloudwatchlive/backend && STAGE=dev AWS_PROFILE=nlmonorepo-cwl-dev yarn deploy
```

#### 4. Create Test User
```bash
cd packages/cloudwatchlive/backend && STAGE=dev AWS_PROFILE=nlmonorepo-cwl-dev yarn post-deploy
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

#### 1. Remove CloudWatchLive Backend
```bash
cd packages/cloudwatchlive/backend && STAGE=dev AWS_PROFILE=nlmonorepo-cwl-dev yarn remove-cwl
```

#### 2. Remove Shared AWS Assets
```bash
cd packages/shared-aws-assets && STAGE=dev AWS_PROFILE=nlmonorepo-shared-dev yarn remove-shared
```

#### 3. Remove Web Application Firewall (WAF)
```bash
cd packages/cwl-waf && STAGE=dev AWS_PROFILE=nlmonorepo-waf-dev yarn remove-waf
```  
    

