import { readFile } from "fs/promises";
import { join } from "path";

export interface StackConfig {
  stackName: string;
  region: string;
  templateBucket: string;
  stage: string;
}

export interface DeploymentOptions {
  stage: string;
  region?: string;
  autoDeleteFailedStacks?: boolean;
  skipFrontendBuild?: boolean;
  skipUpload?: boolean;
  skipInvalidation?: boolean;
  skipUserSetup?: boolean;
}

export interface StackConfig {
  stackName: string;
  region: string;
  templateBucket: string;
  stage: string;
}

export interface DeploymentOptions {
  stage: string;
  region?: string;
  autoDeleteFailedStacks?: boolean;
  skipFrontendBuild?: boolean;
  skipUpload?: boolean;
  skipInvalidation?: boolean;
  skipUserSetup?: boolean;
  // Clean types for deploy package
}

export interface StackConfig {
  stackName: string;
  region: string;
  templateBucket: string;
  stage: string;
}

export interface DeploymentOptions {
  stage: string;
  region?: string;
  autoDeleteFailedStacks?: boolean;
  skipFrontendBuild?: boolean;
  skipUpload?: boolean;
  skipInvalidation?: boolean;
  skipUserSetup?: boolean;
  debugMode?: boolean;
  adminEmail?: string;
  skipUserCreation?: boolean;
  roleArn?: string;
  tags?: { [key: string]: string };
}

export interface ForceDeleteOptions {
  stackType: StackType;
  stage: string;
  region?: string;
}

export enum StackType {
  WAF = "WAF",
  Shared = "Shared",
  CWL = "CWL",
  AwsExample = "AwsExample",
  MyStoryForge = "MyStoryForge",
}

export const STACK_ORDER: StackType[] = [
  StackType.WAF,
  StackType.Shared,
  StackType.CWL,
  StackType.AwsExample,
  StackType.MyStoryForge,
];

export const TEMPLATE_PATHS: Record<StackType, string> = {
  [StackType.WAF]: join(__dirname, "templates/waf/cfn-template.yaml"),
  [StackType.Shared]: join(__dirname, "templates/shared/cfn-template.yaml"),
  [StackType.CWL]: join(__dirname, "templates/cwl/cfn-template.yaml"),
  [StackType.AwsExample]: join(
    __dirname,
    "templates/aws-example/cfn-template.yaml",
  ),
  [StackType.MyStoryForge]: join(
    __dirname,
    "templates/my-story-forge/cfn-template.yaml",
  ),
};

export const TEMPLATE_RESOURCES_PATHS: Record<StackType, string> = {
  [StackType.WAF]: join(__dirname, "templates/waf/"),
  [StackType.Shared]: join(__dirname, "templates/shared/"),
  [StackType.CWL]: join(__dirname, "templates/cwl/"),
  [StackType.AwsExample]: join(__dirname, "templates/aws-example/"),
  [StackType.MyStoryForge]: join(__dirname, "templates/my-story-forge/"),
};

export const getStackName = (stackType: StackType, stage: string) =>
  `nlmonorepo-${String(stackType).toLowerCase().replace(/_/g, "-")}-${stage}`;

export const getTemplateBucketName = (stackType: StackType, stage: string) =>
  `nlmonorepo-${String(stackType).toLowerCase().replace(/_/g, "-")}-templates-${stage}`;

export const getTemplateBody = async (
  stackType: StackType,
): Promise<string> => {
  const templatePath = TEMPLATE_PATHS[stackType];
  return readFile(templatePath, "utf-8");
};
