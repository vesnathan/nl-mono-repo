export interface StageConfig {
  cwlUserPoolId: string;
  cwlUserPoolClientId: string;
  cwlIdentityPoolId: string;
  cwlGraphQLUrl: string;
  cwlUserTableArn: string;
}

export interface CloudFormationOutputs {
  [stage: string]: StageConfig;
}
