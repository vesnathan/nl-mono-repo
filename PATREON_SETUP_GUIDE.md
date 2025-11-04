# Patreon Integration Setup Guide

This guide walks you through setting up Patreon integration for The Story Hub, including creating a Patreon Creator account, configuring OAuth, and connecting it to the application.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Create Patreon Creator Account](#create-patreon-creator-account)
3. [Register Patreon OAuth Application](#register-patreon-oauth-application)
4. [Configure Application Settings](#configure-application-settings)
5. [Deploy Infrastructure](#deploy-infrastructure)
6. [Testing the Integration](#testing-the-integration)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

- Admin access to The Story Hub
- AWS deployment access (for infrastructure setup)
- Email address for Patreon creator account

## Create Patreon Creator Account

1. **Sign up for Patreon**
   - Visit [https://www.patreon.com/signup](https://www.patreon.com/signup)
   - Create a creator account (not a patron account)
   - Verify your email address

2. **Set up your creator page**
   - Complete your profile information
   - Add a profile picture and banner
   - Write a description of your project
   - Set up membership tiers (recommended: Bronze, Silver, Gold, Platinum)

3. **Configure membership tiers**

   Create at least these basic tiers to match the application's badge system:

   - **Bronze Tier** - $3/month
     - Basic supporter benefits
     - Bronze badge in The Story Hub

   - **Silver Tier** - $5/month
     - All Bronze benefits
     - Silver badge in The Story Hub

   - **Gold Tier** - $10/month
     - All Silver benefits
     - Gold badge in The Story Hub

   - **Platinum Tier** - $25/month
     - All Gold benefits
     - Platinum badge in The Story Hub

4. **Note your Campaign ID**
   - Your Campaign ID can be found in your Patreon creator dashboard URL
   - It's the numeric ID after `/campaign/` in the URL
   - Example: `https://www.patreon.com/portal/campaigns/12345678` → Campaign ID is `12345678`
   - Alternatively, you can get it via the Patreon API endpoint: `https://www.patreon.com/api/oauth2/v2/campaigns`

## Register Patreon OAuth Application

1. **Access the Patreon Client Portal**
   - Visit [https://www.patreon.com/portal/registration/register-clients](https://www.patreon.com/portal/registration/register-clients)
   - Log in with your creator account

2. **Create a new client**
   - Click "Create Client"
   - Fill in the application details:

3. **Application Configuration**

   Fill in the following fields:

   - **App Name**: The Story Hub
   - **Description**: Interactive storytelling platform with Patreon supporter integration
   - **App Category**: Choose appropriate category (e.g., "Art & Design" or "Writing")
   - **Author or Company Name**: Your name or company
   - **Icon URL**: URL to your application logo (optional)
   - **Privacy Policy URL**: URL to your privacy policy
   - **Terms of Service URL**: URL to your terms of service

4. **OAuth Redirect URIs**

   Add the OAuth callback URL(s) from your deployment:

   **For Development:**
   ```
   https://{your-api-gateway-id}.execute-api.{region}.amazonaws.com/dev/auth/patreon/callback
   ```

   **For Production:**
   ```
   https://{your-api-gateway-id}.execute-api.{region}.amazonaws.com/prod/auth/patreon/callback
   ```

   You'll get these URLs after deploying the infrastructure (see [Deploy Infrastructure](#deploy-infrastructure)).

5. **Client Credentials**

   After creating the client, you'll receive:
   - **Client ID** - Public identifier for your app
   - **Client Secret** - Keep this secret! Never expose in client-side code

   **Important:** Copy these values immediately and store them securely.

6. **Generate Creator Access Token**

   You'll also need a Creator Access Token for server-side API calls:

   - In the Patreon Portal, go to your client settings
   - Find the "Creator's Access Token" section
   - Click "Generate Token" or use the existing token
   - Copy the token and store it securely

   This token is used for:
   - Fetching campaign member lists
   - Verifying pledge amounts
   - Managing webhooks

7. **Set up Webhook (Optional - for real-time updates)**

   Note: Currently, webhooks are disabled in the application (using seed data for development). Skip this step unless you're enabling webhook support.

   If enabling webhooks in the future:
   - Create a webhook secret (any random string, e.g., use `openssl rand -hex 32`)
   - Configure webhook URL in Patreon portal:
     ```
     https://{your-api-gateway-id}.execute-api.{region}.amazonaws.com/dev/webhooks/patreon
     ```
   - Select events to listen for:
     - `members:pledge:create`
     - `members:pledge:update`
     - `members:pledge:delete`

## Configure Application Settings

### Step 1: Deploy Infrastructure First

Before you can configure the settings, you need to deploy the infrastructure to get the API Gateway URL:

```bash
# From the repository root
yarn deploy:tsh:dev
```

After deployment completes, note the output values:
- `PatreonWebhookApiUrl` - This is your API Gateway base URL
- `PatreonOAuthCallbackUrl` - Use this for Patreon OAuth redirect URI
- `UpdatePatreonSecretsUrl` - Admin API endpoint for managing secrets

### Step 2: Update Patreon OAuth Redirect URI

1. Go back to the Patreon Client Portal
2. Edit your client application
3. Add the `PatreonOAuthCallbackUrl` from the deployment output to the Redirect URIs
4. Save the changes

### Step 3: Configure Secrets via Admin UI

1. **Log in to The Story Hub as an admin**
   - Navigate to your deployed application
   - Log in with an account that has `SiteAdmin` role in Cognito

2. **Access Admin Settings**
   - Click "Admin Settings" in the top navigation bar
   - Scroll to the "Patreon Configuration" section

3. **Enter Patreon Credentials**

   Fill in all the fields from your Patreon setup:

   - **Patreon Campaign ID**: The numeric ID from your campaign URL
   - **Patreon Client ID**: From the Patreon OAuth client
   - **Patreon Client Secret**: From the Patreon OAuth client (will be masked after saving)
   - **Patreon Creator Access Token**: The token generated in Patreon Portal (will be masked)
   - **Patreon Webhook Secret**: Your webhook secret if using webhooks (will be masked)

4. **Save Settings**

   - Each field updates individually when you change it
   - The system automatically syncs to AWS Secrets Manager
   - Sensitive fields are masked after saving (showing only first 8 characters)
   - Changes are applied immediately to all Lambda functions

5. **Security Notes**

   - All credentials are encrypted in transit via HTTPS
   - All credentials are encrypted at rest via AWS KMS
   - Credentials are stored in AWS Secrets Manager (NOT in the database)
   - Only users with `SiteAdmin` role can view or modify these settings

### Step 4: Enable OG Badge for Early Supporters (Optional)

In the admin settings page, you'll also see a toggle:

- **Grant OG Badge to Patreon Supporters**
  - When enabled, any Patreon supporter who connects their account receives the "Early Supporter (OG)" badge
  - Useful during early development to recognize your first supporters
  - Can be disabled later once you have enough early supporters

## Deploy Infrastructure

### Prerequisites

- AWS CLI configured with appropriate credentials
- Node.js and Yarn installed
- Access to the deployment environment

### Deployment Steps

1. **Set Environment Variables**

   Create or update your `.env` file in the repository root:

   ```bash
   # AWS Configuration
   AWS_REGION=us-east-1
   AWS_ACCOUNT_ID=your-account-id

   # Deployment Configuration
   DEPLOYMENT_APP=the-story-hub
   DEPLOYMENT_STAGE=dev  # or 'prod'
   ```

2. **Run Deployment**

   ```bash
   # From repository root
   yarn deploy:tsh:dev
   ```

   This will:
   - Build and package all Lambda functions
   - Create/update CloudFormation stacks
   - Set up API Gateway routes
   - Configure Cognito authorizers
   - Create Secrets Manager secret (with placeholder values)

3. **Note Important Outputs**

   After deployment, save these output values:

   - `PatreonWebhookApiUrl` - Base API URL
   - `PatreonOAuthInitUrl` - OAuth initiation endpoint
   - `PatreonOAuthCallbackUrl` - OAuth callback endpoint (use in Patreon portal)
   - `PatreonSecretsArn` - Secrets Manager ARN
   - `UpdatePatreonSecretsUrl` - Admin API for managing secrets

## Testing the Integration

### 1. Test Admin Settings UI

1. Log in as admin
2. Navigate to Admin Settings
3. Verify all Patreon configuration fields are visible
4. Try updating the Campaign ID field
5. Verify the success message appears
6. Refresh the page and verify the value persists (masked if sensitive)

### 2. Test Patreon OAuth Flow

1. **Log in as a regular user** (not admin)
2. **Navigate to Settings page** (`/settings`)
3. **Click "Connect Patreon"**
   - You should be redirected to Patreon OAuth page
   - Log in with a Patreon account that supports your campaign
   - Authorize the application
4. **Verify redirect back to The Story Hub**
   - Check that your Patreon status is now "Connected"
   - Verify your supporter tier is displayed correctly
   - Check that the appropriate badge appears on your profile

### 3. Test Badge Display

1. Navigate to a story or chapter page
2. Add a comment or contribution
3. Verify your Patreon badge displays next to your username
4. Verify the correct tier badge shows (Bronze/Silver/Gold/Platinum)

### 4. Verify Secrets in AWS Secrets Manager (Admin Only)

```bash
# Using AWS CLI
aws secretsmanager get-secret-value \
  --secret-id nlmonorepo-tsh-patreon-secrets-dev \
  --query SecretString \
  --output text | jq
```

Expected output:
```json
{
  "creatorAccessToken": "your-token-here",
  "webhookSecret": "your-webhook-secret",
  "campaignId": "12345678",
  "clientId": "your-client-id",
  "clientSecret": "your-client-secret"
}
```

## Troubleshooting

### OAuth Errors

**Problem**: "Redirect URI mismatch" error during OAuth

**Solution**:
- Verify the redirect URI in Patreon portal exactly matches the deployed callback URL
- Check that the URL includes the correct API Gateway ID and region
- Ensure you're using HTTPS (not HTTP)

**Problem**: "Invalid client credentials" error

**Solution**:
- Verify Client ID and Client Secret are correctly entered in admin settings
- Check for extra spaces or special characters
- Re-enter the credentials if needed

### Badge Not Showing

**Problem**: User connects Patreon but badge doesn't appear

**Solution**:
1. Verify the user's Patreon pledge is active
2. Check the membership tier matches configured tiers
3. Look at Lambda logs for the OAuth function:
   ```bash
   aws logs tail /aws/lambda/nlmonorepo-tsh-patreon-oauth-dev --follow
   ```
4. Verify the `patreonTier` field in DynamoDB:
   ```bash
   aws dynamodb get-item \
     --table-name nlmonorepo-thestoryhub-datatable-dev \
     --key '{"PK":{"S":"USER#user-id"},"SK":{"S":"PROFILE"}}'
   ```

### Admin Settings Not Loading

**Problem**: Admin settings page shows loading forever or error

**Solution**:
1. Verify you're logged in as admin (check Cognito user attributes)
2. Check that `custom:clientType` includes `SiteAdmin`
3. Verify the API Gateway authorizer is configured correctly
4. Check browser console for errors
5. Verify the `NEXT_PUBLIC_PATREON_API_URL` environment variable is set correctly

### Secrets Not Updating

**Problem**: Changes in admin settings don't persist

**Solution**:
1. Check Lambda execution logs:
   ```bash
   aws logs tail /aws/lambda/nlmonorepo-tsh-update-patreon-secrets-dev --follow
   ```
2. Verify IAM permissions for the Lambda role include:
   - `secretsmanager:GetSecretValue`
   - `secretsmanager:PutSecretValue`
3. Check that the Secrets Manager secret exists:
   ```bash
   aws secretsmanager describe-secret \
     --secret-id nlmonorepo-tsh-patreon-secrets-dev
   ```

### API Gateway Authorization Errors

**Problem**: 403 Forbidden when calling admin endpoints

**Solution**:
1. Verify JWT token is being sent in Authorization header
2. Check token issuer matches Cognito User Pool
3. Verify Cognito User Pool ID in CloudFormation matches actual pool
4. Check API Gateway authorizer configuration:
   ```bash
   aws apigatewayv2 get-authorizers --api-id {your-api-id}
   ```

## Additional Resources

- [Patreon API Documentation](https://docs.patreon.com/)
- [Patreon OAuth Documentation](https://docs.patreon.com/#oauth)
- [AWS Secrets Manager Documentation](https://docs.aws.amazon.com/secretsmanager/)
- [Cognito JWT Tokens](https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-using-tokens-with-identity-providers.html)

## Support

If you encounter issues not covered in this guide:

1. Check CloudWatch Logs for all relevant Lambda functions
2. Verify all CloudFormation stacks deployed successfully
3. Review API Gateway access logs
4. Check browser console for frontend errors
5. Verify network requests in browser DevTools

For deployment-specific issues, review the CloudFormation events:
```bash
aws cloudformation describe-stack-events \
  --stack-name nlmonorepo-thestoryhub-dev \
  --max-items 50
```
