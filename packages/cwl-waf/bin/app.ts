#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { WafStack } from '../lib/waf-stack';

const app = new cdk.App();

// Get configuration from environment or context
const stage = app.node.tryGetContext('stage') || process.env.STAGE;
const awsAccount = process.env.AWS_ACCOUNT_ID;

if (!stage) {
  throw new Error('Stage must be provided either via -c stage=<stage-name> or STAGE environment variable');
}

if (!awsAccount) {
  throw new Error('AWS_ACCOUNT_ID environment variable is required');
}

new WafStack(app, `CWLWafStack-${stage}`, {
  stage,
  env: {
    account: awsAccount,
    region: 'us-east-1', // CloudFront WAF must be in us-east-1
  },
});