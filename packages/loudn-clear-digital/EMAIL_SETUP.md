# Loud'n Clear Digital - Email Setup

## Overview

Both the contact form and quote form are configured to send emails via AWS SES (Simple Email Service) through a Lambda function.

## Architecture

```
Frontend Forms → Lambda Function URL → Lambda (sendContactEmail) → AWS SES → Email Recipient
```

## Configuration

### Lambda Function
- **Location**: `packages/loudn-clear-digital/backend/lambda/sendContactEmail.ts`
- **Runtime**: Node.js 20.x
- **Timeout**: 30 seconds
- **Handler**: `index.handler`

### Environment Variables
Set in CloudFormation template (`resources/Lambda/lambda.yaml`):
- `FROM_EMAIL`: `noreply@loudncleardigital.com`
- `TO_EMAIL`: `hello@loudncleardigital.com`

### Email Fields

#### Contact Form
- Name
- Email
- Phone (optional)
- Message

#### Quote Form
- First Name / Last Name
- Email
- Phone
- Business Type
- Company Name
- Industry (optional)
- Current Website (optional)
- Service Type
- Timeline
- Project Description

## AWS SES Setup Requirements

### 1. Verify Email Addresses
Before sending emails, you must verify the sender and recipient addresses in AWS SES:

```bash
# Verify FROM email
aws ses verify-email-identity --email-address noreply@loudncleardigital.com --region ap-southeast-2

# Verify TO email
aws ses verify-email-identity --email-address hello@loudncleardigital.com --region ap-southeast-2
```

You'll receive verification emails at both addresses. Click the links to verify.

### 2. Check SES Sandbox Status
By default, AWS SES runs in "sandbox mode" which only allows sending to verified email addresses.

To check sandbox status:
```bash
aws sesv2 get-account --region ap-southeast-2
```

**For Production**: Request production access by submitting a case in AWS Support Console:
- Service: SES Sending Limits Increase
- Request type: Service Limit Increase
- Limit type: Desired Daily Sending Quota
- New limit value: (e.g., 50,000)

### 3. Domain Setup (Recommended for Production)
Instead of verifying individual email addresses, verify your domain:

1. Add domain in SES Console
2. Add DNS records (DKIM, SPF) to your domain's DNS
3. Wait for verification (usually < 1 hour)

This allows sending from any address @ your domain without individual verification.

## Deployment

Deploy the Lambda function and infrastructure:

```bash
# From repository root
yarn deploy:loudnclear:dev
```

This will:
1. Compile the Lambda function TypeScript to JavaScript
2. Bundle and upload to S3
3. Create/update CloudFormation stacks:
   - S3 bucket for website
   - Lambda function with SES permissions
   - Lambda Function URL (public endpoint)
4. Output the Function URL

## Testing

### Test Locally (No Email)
The Lambda uses Google's test reCAPTCHA keys by default, which always pass verification.

### Test with Real Emails
1. Ensure SES email addresses are verified
2. Fill out the contact or quote form
3. Check CloudWatch Logs: `/aws/lambda/nlmonorepo-loudncleardigital-send-contact-email-dev`
4. Check recipient email inbox

### Common Issues

**"Email address is not verified"**
- Solution: Verify both FROM and TO email addresses in SES

**"MessageRejected: Email address is not verified"**
- Solution: If in sandbox mode, both sender and recipient must be verified
- Or: Request production access (see above)

**reCAPTCHA verification failed**
- Solution: Ensure `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` is set in frontend `.env.local`
- Or: Use test keys (default) which always pass

**CORS errors**
- Lambda Function URL has CORS configured to allow all origins (`*`)
- Check browser console for specific errors

## Security

- **reCAPTCHA v3**: Both forms use reCAPTCHA v3 for spam protection
- **Score threshold**: 0.5 (configurable in Lambda)
- **Lambda Function URL**: Public (no auth) but protected by reCAPTCHA
- **Rate limiting**: Consider adding AWS WAF rules for additional protection

## Monitoring

CloudWatch Logs are retained for 14 days (configurable in `cfn-template.yaml`).

View logs:
```bash
aws logs tail /aws/lambda/nlmonorepo-loudncleardigital-send-contact-email-dev --follow --region ap-southeast-2
```

## Cost Estimate

- **Lambda**: Free tier covers 1M requests/month
- **SES**: $0.10 per 1,000 emails (after free tier: 62,000 emails/month for first 12 months)
- **S3**: Minimal (< $1/month for small sites)

## Future Improvements

- [ ] Add email templates (HTML formatting)
- [ ] Add auto-reply to customer
- [ ] Add email queueing for high volume
- [ ] Add CloudWatch alarms for failures
- [ ] Add DynamoDB logging of all submissions
- [ ] Add admin dashboard to view submissions
