# Patreon Integration Setup Guide

This guide walks you through setting up Patreon integration for The Story Hub, including creating a Patreon Creator account, configuring OAuth, and connecting it to the application.

## Quick Overview

Setting up Patreon integration involves these main steps:

1. **Create Patreon Creator Account** → Set up your creator page and membership tiers
2. **Register OAuth App** → Get Client ID, Client Secret, and Access Token from Patreon
3. **Deploy Infrastructure** → Deploy AWS resources and get API Gateway URLs
4. **Update Patreon OAuth** → Add the real callback URL to your Patreon app
5. **Configure Admin Settings** → Enter all credentials in The Story Hub admin panel
6. **Test** → Verify the integration works end-to-end

**Total Time**: 30-45 minutes

**What You'll Need**:
- Patreon creator account
- AWS account with deployment access
- Admin access to The Story Hub

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
   - Click "Sign up as a creator" (not "Become a patron")
   - Fill in your email, password, and creator name
   - Verify your email address

2. **Set up your creator page**
   - After signing up, you'll be taken to the creator dashboard
   - Click "Edit page" in the top right corner to customize your page
   - **Profile Picture**: Click on the circular profile image placeholder to upload a logo/photo
   - **Cover Photo**: Click "Add cover photo" at the top to upload a banner image (recommended: 1600x400px)
   - **Page Description**: Scroll down and click "Edit" next to "About" to write your project description
   - Click "Save" after each section

3. **Configure membership tiers**

   To create membership tiers:

   - Look for "Tiers" or "Membership levels" in the left sidebar menu
   - Alternatively, click on "Settings" in the left menu, then look for "Tiers" or "Membership"
   - Or go directly to your creator page and look for "Edit tiers" option
   - Click "Add tier" or "Create a tier" button

   Create at least these basic tiers to match the application's badge system:

   - **Bronze Tier** - $3/month
     - Click "Create a tier"
     - **Tier name**: Bronze
     - **Monthly price**: $3.00
     - **Description**: Basic supporter benefits + Bronze badge in The Story Hub
     - Click "Save tier"

   - **Silver Tier** - $5/month
     - Create another tier with similar steps
     - **Tier name**: Silver
     - **Monthly price**: $5.00
     - **Description**: All Bronze benefits + Silver badge in The Story Hub

   - **Gold Tier** - $10/month
     - **Tier name**: Gold
     - **Monthly price**: $10.00
     - **Description**: All Silver benefits + Gold badge in The Story Hub

   - **Platinum Tier** - $25/month
     - **Tier name**: Platinum
     - **Monthly price**: $25.00
     - **Description**: All Gold benefits + Platinum badge in The Story Hub

   **Important**: The tier names (Bronze, Silver, Gold, Platinum) must match exactly as the application uses these to assign badges.

4. **Note your Campaign ID**

   You'll need this ID for the application configuration:

   - **Option 1 (Easiest)**: Look at your browser URL when in the Patreon creator portal
     - Navigate to "My page" or any creator dashboard page
     - Look for the URL pattern: `https://www.patreon.com/portal/campaigns/12345678`
     - The number after `/campaigns/` is your Campaign ID (e.g., `12345678`)

   - **Option 2**: Via Patreon API
     - While logged in to Patreon, visit: `https://www.patreon.com/api/oauth2/v2/campaigns`
     - Look for the `id` field in the JSON response

   - **Option 3**: From the creator page URL
     - Go to your public creator page (e.g., `https://www.patreon.com/yourname`)
     - Right-click the page, select "View Page Source"
     - Search for `campaignId` in the HTML source

## Register Patreon OAuth Application

1. **Access the Patreon Client Portal**
   - Visit [https://www.patreon.com/portal/registration/register-clients](https://www.patreon.com/portal/registration/register-clients)
   - Log in with your creator account if prompted
   - You should see a page titled "Clients & API Keys"

2. **Create a new client**
   - Click the blue "Create Client" button at the top right
   - A form will appear with multiple fields

3. **Application Configuration**

   Fill in the form with the following information:

   - **App Name**: `The Story Hub`
     - This is the name users will see when authorizing your app

   - **Description**: `Interactive storytelling platform with Patreon supporter integration`
     - Brief description of what your app does

   - **App Category**: Select from dropdown
     - Choose "Art & Design" or "Writing" (whichever fits better)

   - **Author or Company Name**: Your name or company name
     - This appears to users during OAuth

   - **Privacy Policy URL**: Your privacy policy URL
     - Example: `https://yourdomain.com/privacy`
     - Required for OAuth apps

   - **Terms of Service URL**: Your terms of service URL
     - Example: `https://yourdomain.com/terms`
     - Required for OAuth apps

   - **Icon URL** (Optional): URL to your application logo
     - Example: `https://yourdomain.com/logo.png`
     - Must be a publicly accessible image URL
     - Recommended size: 256x256px or larger, square aspect ratio

4. **OAuth Redirect URIs**

   Scroll down to find the "Redirect URIs" section in the form:

   - You'll see a text field labeled "Redirect URI"
   - Click the "+ Add" button to add callback URLs
   - **Important**: You'll need to deploy your infrastructure first to get these URLs (see [Deploy Infrastructure](#deploy-infrastructure))
   - For now, you can use a placeholder like `https://example.com/callback` and update it later
   - After deployment, come back and click "Edit Client" to add the real callback URLs:

   **For Development:**
   ```
   https://{your-api-gateway-id}.execute-api.{region}.amazonaws.com/dev/auth/patreon/callback
   ```

   **For Production:**
   ```
   https://{your-api-gateway-id}.execute-api.{region}.amazonaws.com/prod/auth/patreon/callback
   ```

   - Click "Create Client" button at the bottom of the form

5. **Save Client Credentials**

   After clicking "Create Client", you'll be shown your credentials:

   - **Client ID** - A long alphanumeric string (public, safe to expose)
   - **Client Secret** - A long secret string (KEEP THIS SECRET!)

   **Critical Steps:**
   1. Click "Show" next to Client Secret to reveal it
   2. Copy both Client ID and Client Secret to a secure location (password manager recommended)
   3. These credentials cannot be retrieved again without regenerating them
   4. Click "Done" or "Close" to return to the clients list

6. **Get Creator Access Token**

   You'll need a Creator Access Token for server-side API calls:

   - From the "Clients & API Keys" page, find your newly created client
   - Click on your client name to view details
   - Scroll down to the "Creator's Access Token" section
   - You'll see either:
     - An existing token (if one was auto-generated)
     - A "Generate Token" button

   **To get your token:**
   1. If you see a token, click the "Copy" icon or select and copy it
   2. If you see "Generate Token", click it, then copy the generated token
   3. Store this token securely with your other credentials

   **This token is used for:**
   - Fetching campaign member lists
   - Verifying pledge amounts and tiers
   - Checking member status
   - Managing webhooks (if enabled)

7. **Set up Webhook Secret (Optional)**

   **Note**: Webhooks are currently disabled in the application (using seed data for development). You can skip this step for now.

   If you want to enable webhooks in the future:

   1. **Generate a webhook secret:**
      ```bash
      # On Mac/Linux
      openssl rand -hex 32

      # Or use any password generator to create a 64-character random string
      ```

   2. **Store this secret** - You'll enter it in The Story Hub admin settings

   3. **Configure webhook in Patreon** (after infrastructure is deployed):
      - Go to your client settings
      - Find the "Webhooks" section
      - Click "Add Webhook"
      - **Webhook URL**: `https://{your-api-gateway-id}.execute-api.{region}.amazonaws.com/dev/webhooks/patreon`
      - **Events to trigger**: Select these events:
        - `members:pledge:create`
        - `members:pledge:update`
        - `members:pledge:delete`
      - Click "Save"

8. **Return to Update Redirect URIs Later**

   Remember to come back after deploying your infrastructure:

   1. Go to [Patreon Clients & API Keys](https://www.patreon.com/portal/registration/register-clients)
   2. Click on your client name
   3. Click "Edit Client"
   4. Update the Redirect URIs with the real URLs from your deployment
   5. Click "Update Client"

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
   - Navigate to your deployed application URL
   - Click "Login" in the top navigation bar
   - Enter credentials for an account that has `SiteAdmin` role in Cognito
   - If you don't have an admin account yet, you'll need to create one in AWS Cognito Console and add the `custom:clientType` attribute with value `SiteAdmin`

2. **Access Admin Settings**
   - After logging in, look at the top navigation bar
   - You should see an "Admin Settings" button (only visible to admins)
   - Click "Admin Settings"
   - You'll be taken to `/admin/settings` page
   - Scroll down to find the "Patreon Configuration" section (it has a blue info box)

3. **Enter Patreon Credentials**

   You'll see 5 text input fields. Fill them in order:

   **a) Patreon Campaign ID**
   - Click in the text field under "Patreon Campaign ID"
   - Paste your numeric Campaign ID (from earlier step, e.g., `12345678`)
   - Click outside the field or press Tab
   - The field will auto-save and you'll see a green success message

   **b) Patreon Client ID**
   - Click in the "Patreon Client ID" field
   - Paste your Client ID from Patreon (the long alphanumeric string)
   - Click outside the field to auto-save
   - You'll see a success message

   **c) Patreon Client Secret**
   - Click in the "Patreon Client Secret" field
   - Paste your Client Secret
   - Click outside the field to auto-save
   - **Important**: After saving, this field will show only `abc12345...` (masked for security)
   - If you need to update it later, just paste the full new value

   **d) Patreon Creator Access Token**
   - Click in the "Patreon Creator Access Token" field
   - Paste your Creator Access Token
   - Click outside the field to auto-save
   - This will also be masked after saving

   **e) Patreon Webhook Secret** (optional)
   - Only fill this if you're using webhooks
   - Otherwise, you can leave it empty or put any placeholder value
   - Will be masked after saving

4. **Verify Settings Saved**

   After entering each credential:
   - Wait for the green "Settings saved successfully!" message to appear at the top
   - Refresh the page to verify your settings persisted
   - Sensitive fields should show masked values like `abc12345...`
   - Campaign ID should show the full numeric value (not sensitive)

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
