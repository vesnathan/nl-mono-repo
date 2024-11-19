// mapped to serverless.yml [provider.environment]
type ProcessEnv = {
  USER_FILES_BUCKET_NAME: string;
  STAGE: string;

  cwlUserPoolId: string;
  cwlCloudFrontDistributionId: string;
  cwlCloudFrontDomainName: string;
  cwlBucket: string;
  cwlHistoryDataBucketName: string;
  cwlLatestDataTableName: string;
};
export const getProcessEnv = (): ProcessEnv => {
  return process.env as ProcessEnv;
};
