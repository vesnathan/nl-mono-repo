import * as cdk from 'aws-cdk-lib';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import { Construct } from 'constructs';

export interface WafStackProps extends cdk.StackProps {
  stage: string;
  env: {
    account: string;
    region: string;
  };
}

export class WafStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: WafStackProps) {
    super(scope, id, props);

    // CloudFront WAF (Global)
    const cloudFrontWebAcl = new wafv2.CfnWebACL(this, 'CWLWAF', {
      name: 'CWLWAF',
      scope: 'CLOUDFRONT',
      defaultAction: {
        allow: {}
      },
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: 'myWAFMetric'
      },
      rules: [
        {
          name: 'AWSManagedCommonRuleSet',
          priority: 1,
          overrideAction: {
            none: {}
          },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesCommonRuleSet'
            }
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'AWSManagedCommonRuleSetMetric'
          }
        }
      ]
    });

    // AppSync WAF (Regional)
    const appSyncWebAcl = new wafv2.CfnWebACL(this, 'APPSYNCWAF', {
      name: 'APPSYNCWAF',
      scope: 'REGIONAL',
      defaultAction: {
        allow: {}
      },
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: 'APPSYNCWAFMetric'
      },
      rules: [
        {
          name: 'AWSManagedCommonRuleSet',
          priority: 1,
          overrideAction: {
            none: {}
          },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesCommonRuleSet',
              excludedRules: [
                { name: 'SizeRestrictions_BODY' }
              ]
            }
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'AWSManagedCommonRuleSetMetric'
          }
        }
      ]
    });

    // Skip the association for now to simplify deployment
    // We'll add it back after confirming WAF deployment works

    // Outputs
    new cdk.CfnOutput(this, 'CloudFrontWAFArn', {
      value: cloudFrontWebAcl.attrArn,
      exportName: `CloudFrontWAFArn-${props.stage}`
    });

    new cdk.CfnOutput(this, 'AppSyncWAFArn', {
      value: appSyncWebAcl.attrArn,
      exportName: `AppsyncWAFArn-${props.stage}`
    });
  }
}