// Compiled from: /workspaces/nl-mono-repo/packages/cloudwatchlive/backend/resources/AppSync/resolvers/getProcessEnv.ts\n// Target S3 Key: resolvers/dev/getProcessEnv.js\nimport { z } from "zod";
const ProcessEnvSchema = z.object({
    USER_FILES_BUCKET_NAME: z.string(),
    STAGE: z.string(),
    cwlUserPoolId: z.string(),
    cwlCloudFrontDistributionId: z.string(),
    cwlCloudFrontDomainName: z.string(),
    cwlBucket: z.string(),
    cwlUserTableArn: z.string(),
});
export const getProcessEnv = () => {
    const parsed = ProcessEnvSchema.safeParse(process.env);
    if (!parsed.success) {
        throw new Error(`Invalid environment variables: ${JSON.stringify(parsed.error.format(), null, 2)}`);
    }
    return parsed.data;
};
