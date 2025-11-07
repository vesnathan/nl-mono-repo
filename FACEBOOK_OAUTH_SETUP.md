# Facebook OAuth Setup Guide

This guide walks you through setting up Facebook Sign-In for The Story Hub application.

## Prerequisites

- A Facebook account
- Admin access to The Story Hub admin settings
- Access to the deployed CloudFront URL

## Step 1: Create a Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click **"My Apps"** in the top right
3. Click **"Create App"**
4. Select **"Consumer"** as the app type (for user authentication)
5. Click **"Next"**

## Step 2: Configure App Basic Settings

1. **App Name**: Enter "The Story Hub" (or your preferred name)
2. **App Contact Email**: Enter your email address
3. **Business Account** (optional): You can skip this for now
4. Click **"Create App"**
5. Complete the security check if prompted

## Step 3: Add Facebook Login Product

1. From the app dashboard, find **"Facebook Login"** in the products list
2. Click **"Set Up"** next to Facebook Login
3. Select **"Web"** as the platform
4. You'll be taken to the Facebook Login Quickstart

## Step 4: Configure OAuth Redirect URIs

1. In the left sidebar, click **"Facebook Login"** → **"Settings"**
2. Under **"Valid OAuth Redirect URIs"**, add your Cognito callback URL:
   ```
   https://nlmonorepo-tsh-dev.auth.ap-southeast-2.amazoncognito.com/oauth2/idpresponse
   ```

   **Important**: Replace the domain with your actual Cognito User Pool domain:
   - For **dev**: `nlmonorepo-tsh-dev.auth.ap-southeast-2.amazoncognito.com`
   - For **prod**: Use your production Cognito domain

3. Click **"Save Changes"**

## Step 5: Configure App Domain

1. In the left sidebar, go to **"Settings"** → **"Basic"**
2. Scroll down to **"App Domains"**
3. Add your CloudFront domain (without https://):
   ```
   d32h8ny4vmj7kl.cloudfront.net
   ```
   Replace with your actual CloudFront domain

4. Scroll down to **"Privacy Policy URL"** (required for app review):
   ```
   https://d32h8ny4vmj7kl.cloudfront.net/legal/privacy
   ```

5. Scroll down to **"Terms of Service URL"** (optional but recommended):
   ```
   https://d32h8ny4vmj7kl.cloudfront.net/legal/terms
   ```

6. Click **"Save Changes"** at the bottom

## Step 6: Configure Data Deletion Callback URL (Required)

Facebook requires a Data Deletion Request Callback URL for GDPR compliance.

**IMPORTANT**: You must deploy the backend first (Step 12) before configuring this URL in Facebook, as Facebook will validate the URL by sending a GET request to it.

1. Still in **"Settings"** → **"Basic"**
2. Scroll down to **"Data Deletion Requests"**
3. After deploying the backend (Step 12), enter your Data Deletion Callback URL:
   ```
   https://pvey1gnejj.execute-api.ap-southeast-2.amazonaws.com/dev/facebook/data-deletion
   ```

   **Note**: You can get the exact URL from the CloudFormation stack outputs:
   ```bash
   yarn workspace @deploy/core get-outputs --app the-story-hub --stage dev | grep FacebookDataDeletionCallbackUrl
   ```

4. Click **"Save Changes"**
5. Facebook will send a GET request to validate the URL - if it returns 200 OK, the URL will be accepted

**What this does**:
- When users delete your app from their Facebook settings, Facebook calls this URL via POST
- Your app logs the deletion request and can process it within 30 days
- Users can check the status at: `https://your-domain.com/data-deletion/status?id={confirmation_code}`
- The endpoint also responds to GET requests for Facebook's validation check

## Step 7: Get Your App Credentials

1. Still in **"Settings"** → **"Basic"**
2. Find your **"App ID"** at the top - this is your **Client ID**
3. Find **"App Secret"** - click **"Show"** to reveal it
4. Copy both values - you'll need them in the next step

   **Security Note**: Keep your App Secret confidential!

## Step 8: Configure Permissions

1. In the left sidebar, go to **"Facebook Login"** → **"Settings"**
2. Under **"Client OAuth Settings"**, ensure these are enabled:
   - ✅ **Client OAuth Login**: ON
   - ✅ **Web OAuth Login**: ON
   - ✅ **Use Strict Mode for Redirect URIs**: ON (recommended)
3. Under **"Login Permissions"**, ensure you request:
   - `email` (default)
   - `public_profile` (default)
4. Click **"Save Changes"**

## Step 9: Make App Public (Production Only)

**For Development**: Your app works in "Development Mode" with test users

**For Production**:
1. In the top bar, toggle **"App Mode"** from "Development" to "Live"
2. You'll need to complete **App Review** to go live:
   - Submit your app for review
   - Provide test credentials
   - Explain how your app uses Facebook Login
   - This process can take 3-7 days

## Step 10: Add Test Users (Development)

While in Development Mode, only test users can sign in:

1. Go to **"Roles"** → **"Test Users"** in the left sidebar
2. Click **"Add"** to create test users
3. Test users can sign in without needing app review approval

## Step 11: Configure in The Story Hub Admin Settings

1. Log in to The Story Hub as an admin
2. Go to **Admin Settings**
3. Scroll to **"Facebook OAuth Configuration"**
4. Enter your credentials:
   - **Facebook OAuth Client ID**: Your App ID from Step 7
   - **Facebook OAuth Client Secret**: Your App Secret from Step 7
5. Click **"Save All Settings"**
6. Wait for the success message

## Step 12: Deploy Backend Changes

The admin will need to redeploy the backend to apply the Facebook Identity Provider:

```bash
yarn deploy:tsh:dev:update
```

**What this does**:
- Updates AWS Cognito User Pool with Facebook Identity Provider
- Configures the Client ID and Client Secret
- Enables Facebook as a sign-in option
- Deploys the Data Deletion Callback Lambda

## Step 13: Test Facebook Sign-In

1. Log out of The Story Hub
2. Go to the homepage
3. Click **"Sign In"**
4. Click **"Continue with Facebook"** button
5. You should be redirected to Facebook
6. Authorize the app
7. You should be redirected back and logged in

**Expected Flow**:
- Facebook auth → Cognito → Post-confirmation Lambda → DynamoDB user profile created → User logged in

## Troubleshooting

### "URL Blocked: This redirect failed" Error

**Cause**: Your redirect URI doesn't match what's configured in Facebook

**Fix**: Double-check Step 4 - ensure the Cognito callback URL is exact:
```
https://nlmonorepo-tsh-dev.auth.ap-southeast-2.amazoncognito.com/oauth2/idpresponse
```

### "App Not Set Up" Error

**Cause**: Facebook Login product not properly configured

**Fix**: Complete Steps 3-4 to add Facebook Login and configure redirect URIs

### "Invalid App Domain" Error

**Cause**: Your CloudFront domain isn't added to App Domains

**Fix**: Complete Step 5 to add your CloudFront domain

### Username Shows Facebook ID Instead of Name

**Cause**: DynamoDB user profile created with Facebook sub instead of name

**Fix**: The post-confirmation Lambda already handles this (implemented for Google OAuth). If still occurring, manually update the DynamoDB record.

### Only Admin Can Sign In

**Cause**: App is in Development Mode

**Fix**: Either:
- Add test users (Step 9)
- Make app public (Step 8) - requires app review

## Security Best Practices

1. **Never commit credentials**: Client ID and Secret are stored in AWS Secrets Manager
2. **Use HTTPS only**: Facebook requires HTTPS for redirect URIs
3. **Strict Mode**: Keep "Use Strict Mode for Redirect URIs" enabled
4. **Minimal permissions**: Only request `email` and `public_profile`
5. **Regular rotation**: Periodically regenerate your App Secret
6. **Monitor usage**: Check Facebook Analytics for suspicious activity

## Facebook OAuth vs Google OAuth

**Similarities**:
- Both use OAuth 2.0
- Both provide email and name
- Both integrate with AWS Cognito

**Differences**:
- **App Review**: Facebook requires app review to go public; Google does not
- **Test Users**: Facebook restricts dev mode to test users; Google allows any user
- **Scopes**: Facebook uses `email` and `public_profile`; Google uses `email openid profile`
- **Domain verification**: Facebook requires App Domains; Google requires Authorized JavaScript origins

## Additional Resources

- [Facebook Login Documentation](https://developers.facebook.com/docs/facebook-login/)
- [AWS Cognito Facebook Identity Provider](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-social-idp.html#cognito-user-pools-facebook-idp)
- [Facebook App Review Process](https://developers.facebook.com/docs/app-review/)

## Support

If you encounter issues not covered here:
1. Check Facebook Developer Console for error messages
2. Check AWS Cognito User Pool logs
3. Check CloudWatch logs for post-confirmation Lambda
4. Check browser console for frontend errors
