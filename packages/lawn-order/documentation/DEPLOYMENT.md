# Lawn Order Deployment Documentation

## Live URLs

**Development Environment:**
- **Website**: http://nlmonorepo-lawnorder-website-dev.s3-website-ap-southeast-2.amazonaws.com
- **Contact Page**: http://nlmonorepo-lawnorder-website-dev.s3-website-ap-southeast-2.amazonaws.com/contact/
- **Quote Page**: http://nlmonorepo-lawnorder-website-dev.s3-website-ap-southeast-2.amazonaws.com/quote/
- **Lambda Function URL**: https://2pqtprxtj6zdhu7f52nitgp6ky0gwuvp.lambda-url.ap-southeast-2.on.aws/

## To Get Real reCAPTCHA Keys

Currently, the site uses test reCAPTCHA keys which will work in development but should be replaced with production keys:

### Step 1: Register Your Site
1. Go to https://www.google.com/recaptcha/admin
2. Sign in with your Google account
3. Click the "+" button to register a new site

### Step 2: Configure reCAPTCHA v3
1. **Label**: Enter "Tommy's Law'n Order"
2. **reCAPTCHA type**: Select "reCAPTCHA v3"
3. **Domains**: Add your production domain(s):
   - `tommyslawnorder.com.au`
   - `www.tommyslawnorder.com.au`
4. Accept the reCAPTCHA Terms of Service
5. Click "Submit"

### Step 3: Get Your Keys
After registration, you'll receive:
- **Site Key** (public key - used in frontend)
- **Secret Key** (private key - used in backend Lambda)

### Step 4: Update Environment Variables

**Frontend** (packages/lawn-order/frontend/.env.local):
```bash
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_site_key_here
```

**Lambda** (packages/deploy/templates/lawn-order/resources/Lambda/lambda.yaml):
```yaml
Environment:
  Variables:
    FROM_EMAIL: noreply@tommyslawnorder.com.au
    TO_EMAIL: vesnathan+tlo@gmail.com
    RECAPTCHA_SECRET_KEY: your_secret_key_here
```

### Step 5: Rebuild and Redeploy
```bash
# Build frontend with new key
cd packages/lawn-order/frontend
yarn build

# Redeploy infrastructure with new Lambda secret
cd ../../..
yarn deploy:lawn-order:dev:update
```

## What Was Implemented

### 1. Infrastructure
- **S3 Static Website Hosting**: Hosts the Next.js static export
- **Lambda Function with Function URL**: Handles contact and quote form submissions
- **AWS SES Integration**: Sends emails to vesnathan+tlo@gmail.com
- **CloudFormation Nested Stacks**: Infrastructure as code for repeatable deployments

### 2. reCAPTCHA v3 Integration
- **Invisible Protection**: No user interaction required (no checkboxes)
- **Score-Based Validation**: Server validates score ≥ 0.5 (configurable)
- **Both Forms Protected**: Contact form and quote form both use reCAPTCHA
- **Server-Side Verification**: Lambda validates token with Google API before sending email

### 3. Form Handling
- **Contact Form**: Name, email, phone, message
- **Quote Form**: Detailed property information, service type, rental platform
- **Single Lambda**: Both forms use the same Lambda function
- **Email Formatting**: Different email templates for contact vs quote submissions

### 4. Deployment Scripts
- **Quick Deploy**: `yarn deploy:lawn-order:dev` (replace strategy)
- **Update Deploy**: `yarn deploy:lawn-order:dev:update` (update strategy)
- **Follows TSH Pattern**: Uses same deployment utilities as The Story Hub

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        User's Browser                            │
│  ┌────────────────┐                    ┌────────────────────┐   │
│  │ Contact Form   │                    │   Quote Form       │   │
│  │                │                    │                    │   │
│  │ - reCAPTCHA v3 │                    │ - reCAPTCHA v3     │   │
│  │ - Form Fields  │                    │ - Form Fields      │   │
│  └────────┬───────┘                    └─────────┬──────────┘   │
└───────────┼──────────────────────────────────────┼──────────────┘
            │                                       │
            │  HTTPS POST with reCAPTCHA token     │
            │                                       │
            ▼                                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    AWS Lambda Function                           │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  1. Verify reCAPTCHA token with Google API                 │ │
│  │  2. If score < 0.5: Return 400 error                       │ │
│  │  3. Format email body (contact or quote template)          │ │
│  │  4. Send email via AWS SES                                 │ │
│  │  5. Return success/error response                          │ │
│  └────────────────────────────────────────────────────────────┘ │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                │ SendEmail API call
                                ▼
                    ┌───────────────────────┐
                    │      AWS SES          │
                    │                       │
                    │  Sends email to:      │
                    │  vesnathan+tlo@       │
                    │  gmail.com            │
                    └───────────────────────┘
```

## Testing Instructions

### Test Contact Form
1. Visit http://nlmonorepo-lawnorder-website-dev.s3-website-ap-southeast-2.amazonaws.com/contact/
2. Fill in name, email, phone (optional), and message
3. Click "Send Message"
4. Should see success message
5. Check vesnathan+tlo@gmail.com for email

### Test Quote Form
1. Visit http://nlmonorepo-lawnorder-website-dev.s3-website-ap-southeast-2.amazonaws.com/quote/
2. Fill in all required fields:
   - First/last name
   - Email and phone
   - Service type
   - Property address
   - City and postcode
   - Description
3. Click "Request Quote"
4. Should see success message and scroll to top
5. Check vesnathan+tlo@gmail.com for quote request email

### Test reCAPTCHA
Currently using test keys, so all submissions will pass. With production keys:
- Normal user behavior: Should pass (score ≥ 0.5)
- Bot-like behavior: Should fail (score < 0.5)
- Failed submissions show: "reCAPTCHA verification failed. Please try again."

## Troubleshooting

### Form Submission Fails
1. Check browser console for JavaScript errors
2. Check Network tab for failed requests
3. Verify Lambda Function URL is accessible
4. Check Lambda CloudWatch logs for errors

### Email Not Received
1. Verify TO_EMAIL is correct in Lambda environment variables
2. Check AWS SES sending limits (sandbox mode requires verified recipients)
3. Check spam folder
4. Check Lambda CloudWatch logs for SES errors

### reCAPTCHA Not Loading
1. Check browser console for script loading errors
2. Verify NEXT_PUBLIC_RECAPTCHA_SITE_KEY is set
3. Check internet connectivity
4. Try clearing browser cache

### Deployment Fails
1. Check AWS credentials in `.env` file
2. Verify IAM permissions for the deployment user
3. Check CloudFormation stack events in AWS Console
4. Review deployment logs for specific errors

## Production Deployment Checklist

Before deploying to production:

- [ ] Register real reCAPTCHA keys at https://www.google.com/recaptcha/admin
- [ ] Update NEXT_PUBLIC_RECAPTCHA_SITE_KEY in frontend
- [ ] Update RECAPTCHA_SECRET_KEY in Lambda environment
- [ ] Verify AWS SES is out of sandbox mode or verify production email recipient
- [ ] Update TO_EMAIL to production email address
- [ ] Configure custom domain (tommyslawnorder.com.au) with CloudFront
- [ ] Set up SSL certificate for HTTPS
- [ ] Test both forms thoroughly
- [ ] Set up CloudWatch alarms for Lambda errors
- [ ] Configure S3 bucket policies for production security
- [ ] Update CORS settings to restrict to production domain

## Maintenance

### Update Contact Email
1. Edit `packages/deploy/templates/lawn-order/resources/Lambda/lambda.yaml`
2. Change `TO_EMAIL` environment variable
3. Run `yarn deploy:lawn-order:dev:update`

### Update Frontend
1. Make changes in `packages/lawn-order/frontend/`
2. Build: `cd packages/lawn-order/frontend && yarn build`
3. Sync to S3: `aws s3 sync out/ s3://nlmonorepo-lawnorder-website-dev/ --delete`

### Update Lambda Function
1. Edit `packages/lawn-order/backend/lambda/sendContactEmail.ts`
2. Run `yarn deploy:lawn-order:dev:update`
3. Lambda is automatically compiled and uploaded

### View Logs
```bash
# Lambda logs
aws logs tail /aws/lambda/nlmonorepo-lawnorder-SendContactEmail-dev --follow

# Get specific log stream
aws logs describe-log-streams --log-group-name /aws/lambda/nlmonorepo-lawnorder-SendContactEmail-dev
```

## Cost Estimates

Development usage (low volume):
- **S3 Storage**: ~$0.023/GB/month (website files ~10MB = $0.001/month)
- **S3 Requests**: ~$0.005 per 1,000 GET requests
- **Lambda Invocations**: First 1M requests free, then $0.20 per 1M
- **Lambda Duration**: First 400,000 GB-seconds free
- **SES Emails**: $0.10 per 1,000 emails sent

**Estimated monthly cost**: < $1 for development with minimal traffic
