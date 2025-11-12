# Loud'n Clear Digital - Domain Setup Guide

## Overview

This guide explains how to configure the loudn-clear.com domain to work with the CloudFront distribution.

## Architecture

```
loudn-clear.com (Route 53)
    ↓
CloudFront Distribution (with SSL/TLS certificate)
    ↓
S3 Bucket (private, accessed via CloudFront OAI)
```

## Prerequisites

1. AWS Account with appropriate permissions
2. Domain registered (loudn-clear.com)
3. Access to domain's DNS settings

## Step-by-Step Setup

### 1. Request SSL/TLS Certificate in us-east-1

CloudFront requires certificates to be in the us-east-1 region.

```bash
# Request certificate for loudn-clear.com and www.loudn-clear.com
aws acm request-certificate \
  --domain-name loudn-clear.com \
  --subject-alternative-names www.loudn-clear.com \
  --validation-method DNS \
  --region us-east-1
```

**Output**: Note the `CertificateArn` - you'll need this for deployment.

### 2. Validate Certificate

1. Get the DNS validation records:
```bash
aws acm describe-certificate \
  --certificate-arn arn:aws:acm:us-east-1:ACCOUNT_ID:certificate/CERT_ID \
  --region us-east-1
```

2. Add the CNAME records to your domain's DNS (see DNS Configuration below)

3. Wait for validation (usually < 30 minutes):
```bash
aws acm wait certificate-validated \
  --certificate-arn arn:aws:acm:us-east-1:ACCOUNT_ID:certificate/CERT_ID \
  --region us-east-1
```

### 3. Deploy with Custom Domain

Deploy the stack with domain parameters:

```bash
# For loudn-clear.com
yarn deploy:loudnclear:dev \
  --domain-name loudn-clear.com \
  --certificate-arn arn:aws:acm:us-east-1:ACCOUNT_ID:certificate/CERT_ID

# Or for www.loudn-clear.com
yarn deploy:loudnclear:dev \
  --domain-name www.loudn-clear.com \
  --certificate-arn arn:aws:acm:us-east-1:ACCOUNT_ID:certificate/CERT_ID
```

**Note**: Get the CloudFront distribution domain name from the stack outputs.

### 4. Configure DNS

#### Option A: Using Route 53 (Recommended)

If your domain is hosted on Route 53:

```bash
# Get the hosted zone ID for your domain
aws route53 list-hosted-zones-by-name --dns-name loudn-clear.com

# Get CloudFront distribution domain from stack outputs
CLOUDFRONT_DOMAIN=$(aws cloudformation describe-stacks \
  --stack-name nlmonorepo-loudncleardigital-dev \
  --region ap-southeast-2 \
  --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontURL`].OutputValue' \
  --output text | sed 's|https://||')

# Create A record alias to CloudFront
aws route53 change-resource-record-sets \
  --hosted-zone-id HOSTED_ZONE_ID \
  --change-batch '{
    "Changes": [{
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "loudn-clear.com",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "Z2FDTNDATAQYW2",
          "DNSName": "'$CLOUDFRONT_DOMAIN'",
          "EvaluateTargetHealth": false
        }
      }
    }]
  }'

# Create AAAA record for IPv6
aws route53 change-resource-record-sets \
  --hosted-zone-id HOSTED_ZONE_ID \
  --change-batch '{
    "Changes": [{
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "loudn-clear.com",
        "Type": "AAAA",
        "AliasTarget": {
          "HostedZoneId": "Z2FDTNDATAQYW2",
          "DNSName": "'$CLOUDFRONT_DOMAIN'",
          "EvaluateTargetHealth": false
        }
      }
    }]
  }'
```

**Note**: `Z2FDTNDATAQYW2` is the fixed hosted zone ID for all CloudFront distributions.

#### Option B: Using External DNS Provider

If your domain is hosted elsewhere (Namecheap, GoDaddy, etc.):

1. Log into your DNS provider's control panel
2. Add the following DNS records:

**For loudn-clear.com:**
- Type: CNAME
- Name: @ (or leave blank for root domain)
- Value: `dxxxxxxxxxxxxx.cloudfront.net` (from stack outputs)
- TTL: 300 (or automatic)

**For www.loudn-clear.com:**
- Type: CNAME
- Name: www
- Value: `dxxxxxxxxxxxxx.cloudfront.net`
- TTL: 300

**Important**: Some DNS providers don't support CNAME records for root domains (@). In this case:
- Use A records pointing to CloudFront IP addresses (not recommended - IPs can change)
- Or use DNS provider's ALIAS/ANAME feature (if available)
- Or only use www.loudn-clear.com and redirect root domain

### 5. Redirect www to non-www (or vice versa)

If you want both www and non-www to work:

**Option 1**: Deploy two CloudFront distributions (one for each)
**Option 2**: Use Lambda@Edge to redirect
**Option 3**: Use S3 static website redirect

Example for Option 3 (www → loudn-clear.com):

1. Create a new S3 bucket named `www.loudn-clear.com`
2. Configure it to redirect to `https://loudn-clear.com`
3. Point www CNAME to the S3 bucket website endpoint

## Verification

### Check Certificate Status
```bash
aws acm describe-certificate \
  --certificate-arn YOUR_CERT_ARN \
  --region us-east-1 \
  --query 'Certificate.Status' \
  --output text
```

### Check CloudFront Distribution Status
```bash
aws cloudfront get-distribution \
  --id YOUR_DISTRIBUTION_ID \
  --query 'Distribution.Status' \
  --output text
```

### Test DNS Resolution
```bash
# Check DNS propagation
dig loudn-clear.com
dig www.loudn-clear.com

# Or using nslookup
nslookup loudn-clear.com
nslookup www.loudn-clear.com
```

### Test Website
```bash
# Test CloudFront URL
curl -I https://dxxxxxxxxxxxxx.cloudfront.net

# Test custom domain (after DNS propagation)
curl -I https://loudn-clear.com
```

## Deployment Without Custom Domain

If you don't have a custom domain yet, you can deploy without domain parameters:

```bash
yarn deploy:loudnclear:dev
```

The site will be accessible via CloudFront URL: `https://dxxxxxxxxxxxxx.cloudfront.net`

You can add the custom domain later by updating the stack with the domain parameters.

## Troubleshooting

### "Certificate not found" error
- Ensure certificate is in us-east-1 region
- Verify certificate ARN is correct
- Check certificate status is "ISSUED"

### "Invalid viewer certificate" error
- Certificate must be validated via DNS before use
- Wait for certificate validation to complete

### DNS not resolving
- DNS propagation can take 24-48 hours
- Check your DNS provider's TTL settings
- Verify CNAME/A records are correct
- Try clearing DNS cache: `ipconfig /flushdns` (Windows) or `sudo dscacheutil -flushcache` (Mac)

### CloudFront serving old content
- CloudFront caches content at edge locations
- Create an invalidation:
```bash
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"
```

### 403 Forbidden errors
- Check S3 bucket policy allows CloudFront OAI
- Verify CloudFront distribution is deployed
- Check files exist in S3 bucket

## Costs

- **ACM Certificate**: Free
- **Route 53**: $0.50/month per hosted zone + $0.40 per million queries
- **CloudFront**:
  - First 1 TB/month: $0.085/GB (to internet)
  - First 10M requests: $0.0075 per 10,000 requests
  - Free tier: 1 TB data transfer out, 10M HTTP/HTTPS requests per month for 12 months
- **S3**: Minimal storage costs (< $1/month for small sites)

## Next Steps

1. Set up automatic deployments to S3 + CloudFront invalidation
2. Configure CloudFront custom error pages
3. Enable CloudFront access logs for analytics
4. Set up CloudWatch alarms for monitoring
5. Consider enabling AWS WAF for additional security

## Additional Resources

- [AWS ACM Documentation](https://docs.aws.amazon.com/acm/)
- [CloudFront Custom Domains](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/CNAMEs.html)
- [Route 53 Documentation](https://docs.aws.amazon.com/route53/)
