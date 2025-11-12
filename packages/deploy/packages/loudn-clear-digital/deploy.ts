import { LambdaCompiler } from "../../utils/lambda-compiler";
import { logger } from "../../utils/logger";
import path from "path";
import { DeploymentOptions } from "../../types";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import {
  CloudFormationClient,
  CreateStackCommand,
  UpdateStackCommand,
  DescribeStacksCommand,
  waitUntilStackCreateComplete,
  waitUntilStackUpdateComplete,
} from "@aws-sdk/client-cloudformation";
import { readFileSync } from "fs";
import { getAwsCredentials } from "../../utils/aws-credentials";
import { S3BucketManager } from "../../utils/s3-bucket-manager";

export async function deployLoudnClearDigital(
  options: DeploymentOptions,
): Promise<void> {
  const { stage, region = "ap-southeast-2" } = options;

  logger.info("Starting Loud'n'Clear Digital deployment...");

  // Validate AWS credentials
  const credentials = await getAwsCredentials();

  // Get template bucket name
  const templateBucketName = `nlmonorepo-loudncleardigital-templates-${stage}`;
  const stackName = `nlmonorepo-loudncleardigital-${stage}`;

  const s3 = new S3Client({ region, credentials });
  const cloudformation = new CloudFormationClient({ region, credentials });

  // 0. Ensure template bucket exists before uploading Lambda functions
  logger.info("Ensuring S3 template bucket exists...");
  const s3BucketManager = new S3BucketManager(region);
  const bucketExists =
    await s3BucketManager.ensureBucketExists(templateBucketName);
  if (!bucketExists) {
    throw new Error(`Failed to create template bucket ${templateBucketName}`);
  }

  // 1. Compile Lambda functions
  const baseLambdaDir = path.resolve(
    __dirname,
    "../../../loudn-clear-digital/backend/lambda",
  );
  const outputDir = path.resolve(
    __dirname,
    "../../../loudn-clear-digital/backend/lambda/dist",
  );

  const lambdaCompiler = new LambdaCompiler({
    logger,
    baseLambdaDir,
    outputDir,
    s3BucketName: templateBucketName,
    s3KeyPrefix: "lambdas",
    stage,
    region,
    debugMode: true,
  });

  try {
    await lambdaCompiler.compileLambdaFunctions();
    logger.success("✓ Lambda functions compiled and uploaded successfully");
  } catch (error: any) {
    logger.error(`Failed to compile Lambda functions: ${error.message}`);
    throw error;
  }

  // 2. Upload CloudFormation templates
  logger.info("Uploading CloudFormation templates...");
  const templatesDir = path.resolve(__dirname, "../../templates/loudn-clear-digital");

  const templates = [
    { local: "cfn-template.yaml", s3Key: "cfn-template.yaml" },
    { local: "resources/S3/s3.yaml", s3Key: "resources/S3/s3.yaml" },
    {
      local: "resources/Lambda/lambda.yaml",
      s3Key: "resources/Lambda/lambda.yaml",
    },
  ];

  for (const template of templates) {
    const content = readFileSync(
      path.join(templatesDir, template.local),
      "utf8",
    );
    await s3.send(
      new PutObjectCommand({
        Bucket: templateBucketName,
        Key: template.s3Key,
        Body: content,
        ContentType: "application/x-yaml",
      }),
    );
    logger.success(`✓ Uploaded ${template.local}`);
  }

  // 3. Deploy CloudFormation stack
  logger.info("Deploying CloudFormation stack...");
  const templateUrl = `https://${templateBucketName}.s3.${region}.amazonaws.com/cfn-template.yaml`;

  const parameters = [
    { ParameterKey: "Stage", ParameterValue: stage },
    { ParameterKey: "AppName", ParameterValue: "loudncleardigital" },
    { ParameterKey: "TemplateBucketName", ParameterValue: templateBucketName },
    { ParameterKey: "LogRetentionInDays", ParameterValue: "14" },
  ];

  try {
    // Check if stack exists
    let stackExists = false;
    try {
      await cloudformation.send(
        new DescribeStacksCommand({ StackName: stackName }),
      );
      stackExists = true;
    } catch (e: any) {
      if (!e.message.includes("does not exist")) {
        throw e;
      }
    }

    if (stackExists) {
      logger.info("Stack exists, updating...");
      await cloudformation.send(
        new UpdateStackCommand({
          StackName: stackName,
          TemplateURL: templateUrl,
          Parameters: parameters,
          Capabilities: ["CAPABILITY_NAMED_IAM"],
        }),
      );

      logger.info("Waiting for stack update to complete...");
      await waitUntilStackUpdateComplete(
        { client: cloudformation, maxWaitTime: 600 },
        { StackName: stackName },
      );
      logger.success("✓ Stack updated successfully");
    } else {
      logger.info("Creating new stack...");
      await cloudformation.send(
        new CreateStackCommand({
          StackName: stackName,
          TemplateURL: templateUrl,
          Parameters: parameters,
          Capabilities: ["CAPABILITY_NAMED_IAM"],
          DisableRollback: true,
        }),
      );

      logger.info("Waiting for stack creation to complete...");
      await waitUntilStackCreateComplete(
        { client: cloudformation, maxWaitTime: 600 },
        { StackName: stackName },
      );
      logger.success("✓ Stack created successfully");
    }

    // Get stack outputs
    const describeResult = await cloudformation.send(
      new DescribeStacksCommand({ StackName: stackName }),
    );
    const stack = describeResult.Stacks?.[0];
    if (stack?.Outputs) {
      logger.info("\nStack Outputs:");
      for (const output of stack.Outputs) {
        logger.info(`  ${output.OutputKey}: ${output.OutputValue}`);
      }
    }
  } catch (error: any) {
    logger.error(`CloudFormation deployment failed: ${error.message}`);
    throw error;
  }

  logger.success("\nLawn Order deployment completed successfully");
}
