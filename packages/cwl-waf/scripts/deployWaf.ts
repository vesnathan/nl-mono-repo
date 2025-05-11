import { CloudFormation, waitUntilStackCreateComplete, waitUntilStackUpdateComplete, StackStatus } from '@aws-sdk/client-cloudformation';
import path from 'path';
import fs from 'fs';

const deployWaf = async () => {
  const stage = process.env.STAGE || 'dev';
  const stackName = `CWLWafStack-${stage}`;
  
  const cfn = new CloudFormation({
    region: 'us-east-1' // WAF for CloudFront must be in us-east-1
  });

  const templatePath = path.resolve(__dirname, '../cfn-template.yaml');
  const templateBody = fs.readFileSync(templatePath, 'utf-8');

  try {
    // Check if stack exists
    const stacks = await cfn.listStacks({});
    const stackExists = stacks.StackSummaries?.some(
      stack => stack.StackName === stackName && stack.StackStatus !== StackStatus.DELETE_COMPLETE
    );

    const params = {
      StackName: stackName,
      TemplateBody: templateBody,
      Parameters: [
        {
          ParameterKey: 'Stage',
          ParameterValue: stage
        }
      ],
      Capabilities: ['CAPABILITY_IAM']
    };

    if (stackExists) {
      console.log(`Updating stack ${stackName}...`);
      await cfn.updateStack(params);
      await waitUntilStackUpdateComplete(
        { client: cfn, maxWaitTime: 600 },
        { StackName: stackName }
      );
    } else {
      console.log(`Creating stack ${stackName}...`);
      await cfn.createStack(params);
      await waitUntilStackCreateComplete(
        { client: cfn, maxWaitTime: 600 },
        { StackName: stackName }
      );
    }

    // Get stack outputs and save to WAF_output.json
    const { Stacks } = await cfn.describeStacks({ StackName: stackName });
    if (Stacks && Stacks[0].Outputs) {
      const outputs = Stacks[0].Outputs.reduce((acc: Record<string, string>, output) => {
        if (output.OutputKey && output.OutputValue) {
          acc[output.OutputKey] = output.OutputValue;
        }
        return acc;
      }, {});

      // Read existing WAF_output.json or create new object
      const outputPath = path.resolve(__dirname, '../WAF_output.json');
      let existingOutput = {};
      if (fs.existsSync(outputPath)) {
        existingOutput = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
      }

      // Update outputs for current stage
      const updatedOutput = {
        ...existingOutput,
        [stage]: outputs
      };

      fs.writeFileSync(outputPath, JSON.stringify(updatedOutput, null, 2));
      console.log('WAF outputs saved to WAF_output.json');
    }

    console.log('WAF deployment completed successfully');
  } catch (error: any) {
    if (error.message?.includes('No updates are to be performed')) {
      console.log('No updates required for the WAF stack');
      return;
    }
    console.error('Error deploying WAF:', error);
    throw error;
  }
};

deployWaf().catch(console.error);