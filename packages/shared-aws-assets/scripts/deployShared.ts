import { CloudFormation, Capability, StackStatus, waitUntilStackCreateComplete, waitUntilStackUpdateComplete, waitUntilStackDeleteComplete, CreateStackCommandInput, UpdateStackCommandInput } from '@aws-sdk/client-cloudformation';
import { S3, CreateBucketCommand, GetBucketLocationCommand, PutObjectCommand, BucketLocationConstraint } from '@aws-sdk/client-s3';
import path from 'path';
import fs from 'fs';
import yaml from 'js-yaml';

// Add CloudFormation YAML schema
const cfnSchema = yaml.DEFAULT_SCHEMA.extend({
  implicit: [
    new yaml.Type('!Ref', {
      kind: 'scalar',
      construct: function (data) { return data; }
    }),
    new yaml.Type('!Sub', {
      kind: 'scalar',
      construct: function (data) { return data; }
    }),
    new yaml.Type('!GetAtt', {
      kind: 'scalar',
      construct: function (data) { return data; }
    }),
    new yaml.Type('!Select', {
      kind: 'sequence',
      construct: function (data) { return data; }
    }),
    new yaml.Type('!GetAZs', {
      kind: 'scalar',
      construct: function (data) { return data; }
    }),
    new yaml.Type('!Join', {
      kind: 'sequence',
      construct: function (data) { return data; }
    }),
    new yaml.Type('!ImportValue', {
      kind: 'scalar',
      construct: function (data) { return data; }
    })
  ]
});

// Add yaml validation functions
const validateYamlTemplate = (templatePath: string): boolean => {
  try {
    const templateContent = fs.readFileSync(templatePath, 'utf-8');
    const template = yaml.load(templateContent, { schema: cfnSchema });
    
    if (!template || typeof template !== 'object') {
      throw new Error(`Invalid YAML structure in ${templatePath}`);
    }

    // Basic CloudFormation template validation
    const templateObj = template as { Resources?: Record<string, unknown> };
    if (!templateObj.Resources) {
      throw new Error(`Missing Resources section in ${templatePath}`);
    }

    return true;
  } catch (error) {
    console.error(`Template validation failed for ${templatePath}:`, error);
    return false;
  }
}

const validateAllTemplates = async (resourcesPath: string): Promise<boolean> => {
  const templates: string[] = [];
  
  const findTemplates = (dirPath: string) => {
    const files = fs.readdirSync(dirPath);
    
    for (const file of files) {
      const fullPath = path.join(dirPath, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        findTemplates(fullPath);
      } else if (file.endsWith('.yaml')) {
        templates.push(fullPath);
      }
    }
  };

  findTemplates(resourcesPath);
  
  let allValid = true;
  for (const template of templates) {
    if (!validateYamlTemplate(template)) {
      console.error(`Validation failed for template: ${template}`);
      allValid = false;
    }
  }
  
  return allValid;
};

// Add stack status polling function
const pollStackStatus = async (cfn: CloudFormation, stackName: string): Promise<void> => {
  while (true) {
    const { Stacks } = await cfn.describeStacks({ StackName: stackName }).catch(() => ({ Stacks: [] }));
    const stack = Stacks?.[0];
    
    if (!stack) {
      console.log('Stack not found');
      return;
    }

    const status = stack.StackStatus;
    console.log(`Current stack status: ${status}`);

    if (status === StackStatus.DELETE_IN_PROGRESS) {
      // Wait for deletion to complete
      await new Promise(resolve => setTimeout(resolve, 10000));
      continue;
    }

    if (status === StackStatus.ROLLBACK_IN_PROGRESS || 
        status === StackStatus.ROLLBACK_COMPLETE) {
      // Get failure reasons
      const { StackEvents } = await cfn.describeStackEvents({ StackName: stackName });
      const failureEvents = StackEvents?.filter(event => 
        event.ResourceStatus?.includes('FAILED') ||
        event.ResourceStatus === 'ROLLBACK_COMPLETE' ||
        event.ResourceStatus === 'ROLLBACK_IN_PROGRESS'
      );
      
      console.error('Stack is in rollback state. Failure events:', 
        failureEvents?.map(e => ({
          logical: e.LogicalResourceId,
          status: e.ResourceStatus,
          reason: e.ResourceStatusReason,
          timestamp: e.Timestamp
        }))
      );
      
      throw new Error('Stack entered rollback state');
    }

    if (status?.endsWith('COMPLETE')) {
      return;
    }

    // Wait 10 seconds before checking again
    await new Promise(resolve => setTimeout(resolve, 10000));
  }
};

const waitForStackDeletion = async (cfn: CloudFormation, stackName: string): Promise<void> => {
  while (true) {
    try {
      const { Stacks } = await cfn.describeStacks({ StackName: stackName });
      const stack = Stacks?.[0];
      
      if (!stack) {
        console.log('Stack deletion completed');
        return;
      }

      const status = stack.StackStatus;
      console.log(`Waiting for stack deletion... Current status: ${status}`);

      if (status === StackStatus.DELETE_FAILED) {
        throw new Error('Stack deletion failed');
      }

      // Wait 10 seconds before checking again
      await new Promise(resolve => setTimeout(resolve, 10000));
    } catch (error: any) {
      // If the stack is not found, it means deletion is complete
      if (error.$metadata?.httpStatusCode === 400 && error.message?.includes('does not exist')) {
        console.log('Stack deletion completed');
        return;
      }
      throw error;
    }
  }
};

const forceDeleteStack = async (cfn: CloudFormation, stackName: string): Promise<void> => {
  try {
    // First try to delete all resources in the nested stacks
    const { Stacks } = await cfn.describeStacks({ StackName: stackName }).catch(() => ({ Stacks: [] }));
    const stack = Stacks?.[0];
    
    if (!stack) {
      return;
    }

    // Only use RetainResources for DELETE_FAILED state
    const deleteParams = stack.StackStatus === StackStatus.DELETE_FAILED ? 
      { 
        StackName: stackName,
        RetainResources: ['KMSRole', 'VPCRole', 'CognitoRole', 'S3Role', 'DynamoDBRole']
      } : 
      { StackName: stackName };

    await cfn.deleteStack(deleteParams);

    // Wait for deletion
    while (true) {
      try {
        const { Stacks } = await cfn.describeStacks({ StackName: stackName });
        const stack = Stacks?.[0];
        
        if (!stack) {
          console.log('Stack deletion completed');
          return;
        }

        const status = stack.StackStatus;
        console.log(`Waiting for stack deletion... Current status: ${status}`);

        if (status === StackStatus.DELETE_FAILED) {
          // If delete failed, try again with RetainResources
          await cfn.deleteStack({ 
            StackName: stackName,
            RetainResources: ['KMSRole', 'VPCRole', 'CognitoRole', 'S3Role', 'DynamoDBRole']
          });
        }

        // Wait 10 seconds before checking again
        await new Promise(resolve => setTimeout(resolve, 10000));
      } catch (error: any) {
        // If the stack is not found, it means deletion is complete
        if (error.$metadata?.httpStatusCode === 400 && error.message?.includes('does not exist')) {
          console.log('Stack deletion completed');
          return;
        }
        throw error;
      }
    }
  } catch (error) {
    console.error('Error during force deletion:', error);
    throw error;
  }
};

const createTemplatesBucket = async (bucketName: string, region: string) => {
  const s3 = new S3({ region });
  
  try {
    try {
      // Check if bucket exists using GetBucketLocation
      await s3.send(new GetBucketLocationCommand({ Bucket: bucketName }));
      console.log(`Templates bucket ${bucketName} already exists`);
    } catch (error: any) {
      if (error.$metadata?.httpStatusCode === 404) {
        // Create bucket if it doesn't exist
        await s3.send(new CreateBucketCommand({
          Bucket: bucketName,
          CreateBucketConfiguration: {
            LocationConstraint: region as BucketLocationConstraint
          }
        }));
        console.log(`Created templates bucket ${bucketName}`);
      } else {
        throw error;
      }
    }

    // Upload all template files from resources directory
    const resourcesPath = path.resolve(__dirname, '../resources');
    const uploadTemplates = async (dirPath: string, baseDir: string) => {
      const files = fs.readdirSync(dirPath);
      
      for (const file of files) {
        const fullPath = path.join(dirPath, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          await uploadTemplates(fullPath, baseDir);
        } else if (file.endsWith('.yaml')) {
          const fileContent = fs.readFileSync(fullPath);
          const s3Key = `resources/${path.relative(baseDir, fullPath)}`;
          
          await s3.send(new PutObjectCommand({
            Bucket: bucketName,
            Key: s3Key,
            Body: fileContent
          }));
          console.log(`Uploaded template: ${s3Key}`);
        }
      }
    };

    await uploadTemplates(resourcesPath, resourcesPath);
  } catch (error) {
    throw error;
  }
};

const validateKMSTemplate = (templateBody: string) => {
  try {
    const template = JSON.parse(templateBody);
    const kmsKey = template.Resources?.cwlKMSKey;
    
    if (!kmsKey) return true; // No KMS key in template
    
    const keyPolicy = kmsKey.Properties?.KeyPolicy;
    if (!keyPolicy) return true;
    
    // Validate principals in the policy statements
    const statements = keyPolicy.Statement || [];
    for (const statement of statements) {
      const principal = statement.Principal;
      if (!principal) continue;
      
      // Check for valid principal types
      if (principal.AWS && typeof principal.AWS === 'string' && !principal.AWS.startsWith('arn:aws:')) {
        throw new Error(`Invalid AWS principal in KMS policy: ${principal.AWS}`);
      }
      
      if (principal.Service && Array.isArray(principal.Service)) {
        const validServices = ['dynamodb.amazonaws.com', 's3.amazonaws.com', 'cloudformation.amazonaws.com'];
        const invalidServices = principal.Service.filter((svc: string) => !validServices.includes(svc));
        if (invalidServices.length > 0) {
          throw new Error(`Invalid service principals in KMS policy: ${invalidServices.join(', ')}`);
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error('KMS template validation failed:', error);
    return false;
  }
};

const deployStack = async () => {
  const stage = process.env.STAGE || 'dev';
  const region = 'ap-southeast-2';
  const templatesBucket = `nl-mono-repo-templates-${stage}`;
  
  // Validate all templates before proceeding
  const resourcesPath = path.resolve(__dirname, '../resources');
  console.log('Validating all templates...');
  if (!await validateAllTemplates(resourcesPath)) {
    throw new Error('Template validation failed. Please check the template files.');
  }
  console.log('All templates validated successfully');

  // Create/verify templates bucket first
  await createTemplatesBucket(templatesBucket, region);

  const stackName = `shared-aws-assets-${stage}`;
  const cfn = new CloudFormation({ region });
  const mainTemplatePath = path.resolve(__dirname, '../cfn-template.yaml');
  const templateContent = fs.readFileSync(mainTemplatePath, 'utf-8');

  try {
    // Check if stack exists and get its status
    const { Stacks } = await cfn.describeStacks({ StackName: stackName }).catch(() => ({ Stacks: [] }));
    let existingStack = Stacks?.[0];
    const isRollbackComplete = existingStack?.StackStatus === StackStatus.ROLLBACK_COMPLETE;
    const isRollbackInProgress = existingStack?.StackStatus === StackStatus.ROLLBACK_IN_PROGRESS;
    const isDeleteInProgress = existingStack?.StackStatus === StackStatus.DELETE_IN_PROGRESS;
    const isDeleteFailed = existingStack?.StackStatus === StackStatus.DELETE_FAILED;
    const isRollbackFailed = existingStack?.StackStatus === StackStatus.ROLLBACK_FAILED;

    if (existingStack && (isRollbackComplete || isRollbackInProgress || isDeleteInProgress || isDeleteFailed || isRollbackFailed)) {
      console.log(`Stack ${stackName} is in ${existingStack?.StackStatus} state, forcing deletion...`);
      await forceDeleteStack(cfn, stackName);
      existingStack = undefined;
    }

    const stackParams = {
      StackName: stackName,
      TemplateBody: templateContent,
      Capabilities: [Capability.CAPABILITY_NAMED_IAM, Capability.CAPABILITY_IAM, Capability.CAPABILITY_AUTO_EXPAND],
      Parameters: [
        {
          ParameterKey: 'Stage',
          ParameterValue: stage
        },
        {
          ParameterKey: 'TemplatesBucketName',
          ParameterValue: templatesBucket
        }
      ]
    };

    if (existingStack) {
      console.log(`Updating stack ${stackName}...`);
      await cfn.updateStack(stackParams);
    } else {
      console.log(`Creating stack ${stackName}...`);
      await cfn.createStack(stackParams);
    }

    await pollStackStatus(cfn, stackName);

    console.log('Deployment completed successfully');
  } catch (error: any) {
    if (error.message?.includes('No updates are to be performed')) {
      console.log('No updates required for the stack');
      return;
    }
    throw error;
  }
};

deployStack().catch(console.error);
