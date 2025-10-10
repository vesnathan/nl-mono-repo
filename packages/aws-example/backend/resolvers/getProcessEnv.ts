import { z } from "zod";

const ProcessEnvSchema = z.object({
  USER_FILES_BUCKET_NAME: z.string(),
  STAGE: z.string(),
  awsbUserPoolId: z.string(),
  awsbCloudFrontDistributionId: z.string(),
  awsbCloudFrontDomainName: z.string(),
  awsbBucket: z.string(),
  awsbUserTableArn: z.string(),
});

type ProcessEnv = z.infer<typeof ProcessEnvSchema>;

export const getProcessEnv = (): ProcessEnv => {
  const parsed = ProcessEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(
      `Invalid environment variables: ${JSON.stringify(parsed.error.format(), null, 2)}`,
    );
  }
  return parsed.data;
};
