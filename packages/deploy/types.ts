import { join } from 'path';
import { readFile } from 'fs/promises';

export interface StackConfig {
  stackName: string;
  region: string;
  templateBucket: string;
  stage: string;
}

export interface DeploymentOptions {
  autoDeleteFailedStacks?: boolean;
  stage: string;
  packageName?: string; // For single package deployment
}

export type StackType = 'waf' | 'shared' | 'cwl';

export interface AwsCredentials {
  accessKeyId: string;
  secretAccessKey: string;
}

export const TEMPLATE_PATHS = {
  waf: join(__dirname, 'templates/waf/cfn-template.yaml'),
  shared: join(__dirname, 'templates/shared/cfn-template.yaml'),
  cwl: join(__dirname, 'templates/cwl/cfn-template.yaml'),
} as const;

export const TEMPLATE_RESOURCES_PATHS = {
  waf: join(__dirname, 'templates/waf/resources'),
  shared: join(__dirname, 'templates/shared/resources'),
  cwl: join(__dirname, 'templates/cwl/resources'),
} as const;

export async function getTemplateBody(stackType: StackType): Promise<string> {
  return await readFile(TEMPLATE_PATHS[stackType], 'utf8');
}

// Stack names
export const getStackName = (stackType: StackType, stage: string) => `nlmonorepo-${stackType}-${stage}`;

// S3 bucket names for templates
export const getTemplateBucketName = (stackType: StackType, stage: string) => `nlmonorepo-${stackType}-templates-${stage}`;
