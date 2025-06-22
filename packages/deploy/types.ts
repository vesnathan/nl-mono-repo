import { join } from 'path';
import { readFile } from 'fs/promises';
import { Tag } from '@aws-sdk/client-cloudformation';

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
  skipUpload?: boolean; // Added for frontend deployment
  skipInvalidation?: boolean; // Added for frontend deployment
  skipUserSetup?: boolean;
  debugMode?: boolean; // Added for general debug logging
  adminEmail?: string; // Added for CWL stack deployment
  skipUserCreation?: boolean; // Added for CWL stack deployment (alternative to skipUserSetup)
  roleArn?: string;
  tags?: { [key: string]: string };
}

export interface ForceDeleteOptions {
  stackType: StackType;
  stage: string;
  region?: string;
}

export enum StackType {
  WAF = 'WAF',
  Shared = 'Shared',
  CWL = 'CWL',
}

export const STACK_ORDER = [
  StackType.WAF,
  StackType.Shared,
  StackType.CWL,
];

export const TEMPLATE_PATHS: Record<StackType, string> = {
  [StackType.WAF]: join(__dirname, 'templates/waf/cfn-template.yaml'),
  [StackType.Shared]: join(__dirname, 'templates/shared/cfn-template.yaml'),
  [StackType.CWL]: join(__dirname, 'templates/cwl/cfn-template.yaml'),
};

export const TEMPLATE_RESOURCES_PATHS: Record<StackType, string> = {
  [StackType.WAF]: join(__dirname, 'templates/waf/'),
  [StackType.Shared]: join(__dirname, 'templates/shared/'),
  [StackType.CWL]: join(__dirname, 'templates/cwl/'),
};

export const getStackName = (stackType: StackType, stage: string) => `nlmonorepo-${stackType.toLowerCase()}-${stage}`;

export const getTemplateBucketName = (stackType: StackType, stage: string) => `nlmonorepo-${stackType.toLowerCase()}-templates-${stage}`;

export const getTemplateBody = async (stackType: StackType): Promise<string> => {
  return await readFile(TEMPLATE_PATHS[stackType], 'utf8');
}
