import { 
  CloudFormationClient, 
  CreateStackCommand, 
  DeleteStackCommand, 
  DescribeStacksCommand, 
  DescribeStackEventsCommand,
  StackStatus,
  Parameter,
  Stack
} from '@aws-sdk/client-cloudformation';
import { logger } from './utils/logger';
import { readFileSync } from 'fs';
import { join } from 'path';
import ora from 'ora';
import { v4 as uuidv4 } from 'uuid';
import inquirer from 'inquirer';

export interface DeploymentOptions {
  instanceType: string;
  keyPair?: string;
  allowedIps: string;
  volumeSize: string;
  stackName: string;
  autoStop?: string;
}

export class DeploymentManager {
  private cfnClient: CloudFormationClient;
  private region: string;

  constructor() {
    this.region = process.env.AWS_REGION || 'ap-southeast-2';
    this.cfnClient = new CloudFormationClient({ region: this.region });
  }

  async deploy(options: DeploymentOptions): Promise<void> {
    logger.info(`Deploying VSCode server with stack name: ${options.stackName}`);

    // Check if stack already exists
    let stackExists = await this.stackExists(options.stackName);
    if (stackExists) {
      logger.warning(`Stack ${options.stackName} already exists.`);
      const { update } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'update',
          message: 'Do you want to update the existing stack?',
          default: false
        }
      ]);

      if (!update) {
        const { remove } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'remove',
            message: 'Do you want to delete the existing stack and redeploy?',
            default: false
          }
        ]);
        if (!remove) {
          logger.info('Deployment cancelled.');
          return;
        }
        // Delete the stack and wait for deletion
        await this.remove(options.stackName);
        // Wait for stack to be fully deleted before proceeding
        logger.info('Waiting for stack to be fully deleted before redeploying...');
        let deleted = false;
        for (let i = 0; i < 60; i++) { // up to 10 minutes
          stackExists = await this.stackExists(options.stackName);
          if (!stackExists) {
            deleted = true;
            break;
          }
          await new Promise(res => setTimeout(res, 10000));
        }
        if (!deleted) {
          logger.error('Timed out waiting for stack deletion. Please check the AWS Console.');
          return;
        }
        logger.success('Stack deleted. Proceeding with fresh deployment.');
      }
    }


    // Load CloudFormation template
    const templatePath = join(__dirname, '..', 'cfn-template.yaml');
    const template = readFileSync(templatePath, 'utf8');

    // Prepare parameters
    const parameters: Parameter[] = [
      { ParameterKey: 'InstanceType', ParameterValue: options.instanceType },
      { ParameterKey: 'AutoStopEnabled', ParameterValue: process.env.COST_OPT_AUTO_STOP || 'true' },
    ];

    if (options.keyPair) {
      parameters.push({ ParameterKey: 'KeyPairName', ParameterValue: options.keyPair });
    }

    // Deploy stack
    const spinner = ora('Deploying CloudFormation stack...').start();

    try {
      const command = new CreateStackCommand({
        StackName: options.stackName,
        TemplateBody: template,
        Parameters: parameters,
        Capabilities: ['CAPABILITY_NAMED_IAM'],
        Tags: [
          { Key: 'Project', Value: 'EC2-VSCode-Server' },
          { Key: 'DeployedBy', Value: 'ec2-vsc-cli' },
          { Key: 'CreatedAt', Value: new Date().toISOString() }
        ]
      });

      await this.cfnClient.send(command);
      spinner.text = 'Stack deployment initiated, waiting for completion...';

      // Wait for stack to complete and then monitor installation progress
      await this.waitForStackCompletion(options.stackName, spinner);
      
      spinner.succeed('Stack deployed successfully!');

      // Get stack outputs and wait for full installation
      await this.displayStackOutputsWithInstallationTracking(options.stackName);

    } catch (error: any) {
      spinner.fail('Stack deployment failed');
      logger.error(error?.message || error);
      await this.printStackFailureReasons(options.stackName);
      throw error;
    }
  }

  /**
   * Print CloudFormation stack failure reasons for the given stack
   */
  private async printStackFailureReasons(stackName: string): Promise<void> {
    try {
      const command = new DescribeStackEventsCommand({ StackName: stackName });
      const response = await this.cfnClient.send(command);
      const failedEvents = response.StackEvents?.filter(event =>
        event.ResourceStatus && event.ResourceStatus.includes('FAILED')
      );
      if (failedEvents && failedEvents.length > 0) {
        logger.error('\nCloudFormation failure details:');
        for (const event of failedEvents) {
          logger.error(`  Resource: ${event.LogicalResourceId} (${event.ResourceType})`);
          logger.error(`  Reason: ${event.ResourceStatusReason}`);
        }
      } else {
        logger.error('No CloudFormation failure events found. Check the AWS Console for more details.');
      }
    } catch (err: any) {
      logger.error('Could not fetch stack failure details: ' + (err?.message || err));
    }
  }

  async remove(stackName: string): Promise<void> {
    logger.info(`Removing stack: ${stackName}`);

    const stackExists = await this.stackExists(stackName);
    if (!stackExists) {
      logger.warning(`Stack ${stackName} does not exist.`);
      return;
    }

    const spinner = ora('Deleting CloudFormation stack...').start();

    try {
      const command = new DeleteStackCommand({
        StackName: stackName
      });

      await this.cfnClient.send(command);
      spinner.text = 'Stack deletion initiated, waiting for completion...';

      // Wait for stack deletion to complete
      await this.waitForStackDeletion(stackName, spinner);
      
      spinner.succeed('Stack deleted successfully!');

    } catch (error: any) {
      spinner.fail('Stack deletion failed');
      throw error;
    }
  }

  private async stackExists(stackName: string): Promise<boolean> {
    try {
      const command = new DescribeStacksCommand({
        StackName: stackName
      });

      const response = await this.cfnClient.send(command);
      return !!(response.Stacks && response.Stacks.length > 0);
    } catch (error: any) {
      if (error.name === 'ValidationError') {
        return false;
      }
      throw error;
    }
  }

  private async waitForStackCompletion(stackName: string, spinner: ora.Ora): Promise<void> {
    const timeout = 30 * 60 * 1000; // 30 minutes
    const interval = 15000; // 15 seconds
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      try {
        const command = new DescribeStacksCommand({
          StackName: stackName
        });

        const response = await this.cfnClient.send(command);
        const stack = response.Stacks?.[0];

        if (!stack) {
          throw new Error('Stack not found');
        }

        const status = stack.StackStatus;
        spinner.text = `Stack status: ${status}`;

        if (status === StackStatus.CREATE_COMPLETE || status === StackStatus.UPDATE_COMPLETE) {
          return;
        }

        if (status === StackStatus.CREATE_FAILED || 
            status === StackStatus.UPDATE_FAILED ||
            status === StackStatus.ROLLBACK_COMPLETE ||
            status === StackStatus.UPDATE_ROLLBACK_COMPLETE) {
          throw new Error(`Stack deployment failed with status: ${status}`);
        }

        await new Promise(resolve => setTimeout(resolve, interval));
      } catch (error: any) {
        if (error.message.includes('Stack deployment failed')) {
          throw error;
        }
        // Continue waiting for other errors
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }

    throw new Error('Stack deployment timeout');
  }

  private async waitForStackDeletion(stackName: string, spinner: ora.Ora): Promise<void> {
    const timeout = 20 * 60 * 1000; // 20 minutes
    const interval = 10000; // 10 seconds
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      try {
        const command = new DescribeStacksCommand({
          StackName: stackName
        });

        const response = await this.cfnClient.send(command);
        const stack = response.Stacks?.[0];

        if (!stack) {
          // Stack no longer exists - deletion complete
          return;
        }

        const status = stack.StackStatus;
        spinner.text = `Stack status: ${status}`;

        if (status === StackStatus.DELETE_FAILED) {
          throw new Error(`Stack deletion failed with status: ${status}`);
        }

        await new Promise(resolve => setTimeout(resolve, interval));
      } catch (error: any) {
        if (error.name === 'ValidationError' && error.message.includes('does not exist')) {
          // Stack successfully deleted
          return;
        }
        
        if (error.message.includes('Stack deletion failed')) {
          throw error;
        }
        
        // Continue waiting for other errors
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }

    throw new Error('Stack deletion timeout');
  }

  private async displayStackOutputsWithInstallationTracking(stackName: string): Promise<void> {
    try {
      const command = new DescribeStacksCommand({
        StackName: stackName
      });

      const response = await this.cfnClient.send(command);
      const stack = response.Stacks?.[0];

      if (!stack?.Outputs) {
        logger.warning('No stack outputs available');
        return;
      }

      // Get connection details
      const instanceId = stack.Outputs.find(o => o.OutputKey === 'InstanceId')?.OutputValue;
      const publicIp = stack.Outputs.find(o => o.OutputKey === 'PublicIP')?.OutputValue;
      const vscodeUrl = stack.Outputs.find(o => o.OutputKey === 'VSCodeURL')?.OutputValue;
      const sshCommand = stack.Outputs.find(o => o.OutputKey === 'SSHCommand')?.OutputValue;

      if (!instanceId || !publicIp) {
        logger.warning('Could not get instance details from stack outputs');
        return;
      }

      logger.info('\n🚀 VS Code Server deployment started!');
      logger.info(`📍 Instance ID: ${instanceId}`);
      logger.info(`🌍 Public IP: ${publicIp}`);
      logger.info('\n📦 Monitoring package installation progress...\n');

      // Wait for EC2 instance to be running first
      await this.waitForInstanceRunning(instanceId);
      
      // Monitor installation progress in real-time
      await this.monitorInstallationProgressRealTime(publicIp);

      // Display final connection information
      logger.info('\n🎉 Installation completed successfully!');
      logger.info('\n📋 Your VS Code Server is ready:');
      
      if (vscodeUrl) {
        logger.success(`🌐 VS Code URL: ${vscodeUrl}`);
        logger.info('   Password: vscodepassword');
      }
      if (sshCommand) {
        logger.info(`🔑 SSH Command: ${sshCommand}`);
      }

      logger.info('\n💡 Important Notes:');
      logger.info('• HTTPS uses a self-signed certificate - accept the browser security warning');
      logger.info('• The instance will auto-stop after 2 hours of inactivity (if enabled)');
      logger.info('\n✅ Deployment complete - enjoy coding!');

    } catch (error: any) {
      logger.error(`Failed to track installation: ${error.message}`);
    }
  }

  private async waitForInstanceRunning(instanceId: string): Promise<void> {
    logger.info('⏳ Waiting for EC2 instance to be running...');
    const { EC2Client, DescribeInstancesCommand } = await import('@aws-sdk/client-ec2');
    const ec2Client = new EC2Client({ region: this.region });
    
    let instanceRunning = false;
    let attempts = 0;
    const maxAttempts = 30; // 5 minutes max
    
    while (!instanceRunning && attempts < maxAttempts) {
      const command = new DescribeInstancesCommand({ InstanceIds: [instanceId] });
      const response = await ec2Client.send(command);
      const instance = response.Reservations?.[0]?.Instances?.[0];
      
      if (instance?.State?.Name === 'running') {
        instanceRunning = true;
        logger.success('✅ EC2 instance is running');
      } else {
        logger.info(`   Instance state: ${instance?.State?.Name || 'unknown'}`);
        await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
        attempts++;
      }
    }
    
    if (!instanceRunning) {
      throw new Error('Instance did not reach running state within 5 minutes');
    }
  }

  private async monitorInstallationProgressRealTime(publicIp: string): Promise<void> {
    const maxWaitTime = 1200; // 20 minutes total
    const startTime = Date.now();
    let installationComplete = false;
    let seenLines = new Set<string>();
    let consecutiveFailures = 0;
    const maxConsecutiveFailures = 5;
    
    while (!installationComplete && (Date.now() - startTime) < maxWaitTime * 1000) {
      try {
        // Get installation log from the instance
        const { spawn } = await import('child_process');
        const getLog = spawn('ssh', [
          '-i', 'ec2-vscode-server-dev-key.pem',
          '-o', 'StrictHostKeyChecking=no',
          '-o', 'ConnectTimeout=10',
          '-o', 'ServerAliveInterval=60',
          '-o', 'UserKnownHostsFile=/dev/null',
          '-o', 'LogLevel=ERROR', // Suppress SSH verbose output
          `ec2-user@${publicIp}`,
          `sudo tail -30 /var/log/code-server-install.log 2>/dev/null || echo "LOG_NOT_READY"`
        ]);
        
        let logOutput = '';
        getLog.stdout.on('data', (data) => {
          logOutput += data.toString();
        });
        
        getLog.stderr.on('data', (data) => {
          // Suppress SSH connection warnings
        });
        
        const logPromise = new Promise<void>((resolve) => {
          getLog.on('close', () => resolve());
        });
        
        await Promise.race([
          logPromise,
          new Promise(resolve => setTimeout(resolve, 8000)) // 8 second timeout
        ]);
        
        if (logOutput && !logOutput.includes('LOG_NOT_READY') && logOutput.trim() !== '') {
          consecutiveFailures = 0; // Reset failure count on success
          
          // Process lines and only show new ones
          const lines = logOutput.trim().split('\n').filter(line => line.trim() !== '');
          const relevantLines = lines.filter(line => this.shouldDisplayLogLine(line));
          
          // Only show lines we haven't seen before
          let newLinesShown = false;
          for (const line of relevantLines) {
            const lineKey = line.trim();
            if (!seenLines.has(lineKey) && lineKey !== '') {
              logger.info(`   ${line}`);
              seenLines.add(lineKey);
              newLinesShown = true;
            }
          }
          
          // Check if installation is complete
          if (logOutput.includes('✅ Installation completed successfully') || 
              logOutput.includes('✅ code-server accessible at:')) {
            installationComplete = true;
            logger.info('🎉 Installation monitoring complete!');
            break;
          }
          
          // Check for actual critical failures (multiple consecutive failures in recent lines)
          const recentLines = lines.slice(-10); // Check last 10 lines
          const recentFailures = recentLines.filter(l => l.includes('❌ Essential package installation failed')).length;
          const recentSuccesses = recentLines.filter(l => l.includes('✅') || l.includes('✓')).length;
          
          if (recentFailures >= 3 && recentSuccesses === 0) {
            logger.error('❌ Installation appears to have failed. Multiple recent package installation failures detected.');
            logger.info('💡 You can check the full log with:');
            logger.info(`   ssh -i ec2-vscode-server-dev-key.pem ec2-user@${publicIp} "sudo tail -f /var/log/code-server-install.log"`);
            break;
          }
          
        } else if (logOutput.includes('LOG_NOT_READY')) {
          if (consecutiveFailures === 0) {
            logger.info('   ⏳ Instance starting up, waiting for installation logs...');
          }
          consecutiveFailures++;
        } else {
          consecutiveFailures++;
        }
        
      } catch (error: any) {
        consecutiveFailures++;
        if (consecutiveFailures === 1) {
          logger.info('   ⏳ Waiting for instance to be accessible via SSH...');
        }
      }
      
      // If we have too many consecutive failures, reduce polling frequency
      if (consecutiveFailures >= maxConsecutiveFailures) {
        await new Promise(resolve => setTimeout(resolve, 15000)); // Wait 15 seconds
        consecutiveFailures = Math.floor(maxConsecutiveFailures / 2); // Reset but keep some count
      } else if (!installationComplete) {
        await new Promise(resolve => setTimeout(resolve, 6000)); // Wait 6 seconds between checks
      }
    }

    if (!installationComplete) {
      logger.warning('⚠️ Installation monitoring timed out after 20 minutes');
      logger.info('💡 The installation may still be running. You can check with:');
      logger.info(`   ssh -i ec2-vscode-server-dev-key.pem ec2-user@${publicIp} "sudo tail -f /var/log/code-server-install.log"`);
    }
  }

  private shouldDisplayLogLine(line: string): boolean {
    // Filter to show only relevant installation progress
    const relevantPatterns = [
      '📦 Step',
      '→ Installing',
      '→ Downloading',
      '→ Setting up',
      '→ Configuring',
      '→ Attempting',
      '→ Verifying',
      '✅',
      '✓',
      '⚠️',
      '❌',
      'ERROR:',
      'SUCCESS:',
      'Package Installation Summary',
      'All package installations completed',
      'Installation completed successfully',
      'code-server service started',
      'code-server is accessible'
    ];
    
    return relevantPatterns.some(pattern => line.includes(pattern));
  }

  private async displayStackOutputsQuick(stackName: string): Promise<void> {
    try {
      const command = new DescribeStacksCommand({
        StackName: stackName
      });

      const response = await this.cfnClient.send(command);
      const stack = response.Stacks?.[0];

      if (!stack?.Outputs) {
        logger.warning('No stack outputs available');
        return;
      }

      logger.info('\n🎉 VS Code Server deployment initiated successfully!');
      logger.info('\n📋 Connection Information:');
      
      for (const output of stack.Outputs) {
        const key = output.OutputKey;
        const value = output.OutputValue;

        if (key === 'VSCodeURL') {
          logger.success(`🌐 VS Code URL: ${value}`);
          logger.info('   Password: vscodepassword');
        } else if (key === 'PublicIP') {
          logger.info(`🌍 Public IP: ${value}`);
        } else if (key === 'SSHCommand') {
          logger.info(`🔑 SSH Command: ${value}`);
        }
      }

      logger.info('\n💡 Important Notes:');
      logger.info('• The server is installing packages - it may take 5-10 minutes to be fully ready');
      logger.info('• HTTPS uses a self-signed certificate - accept the browser security warning');
      logger.info('• The instance will auto-stop after 2 hours of inactivity (if enabled)');
      logger.info('\n✅ Deployment complete - you can now close this terminal');

    } catch (error: any) {
      logger.error(`Failed to get stack outputs: ${error.message}`);
    }
  }

  private async displayStackOutputs(stackName: string): Promise<void> {
    try {
      const command = new DescribeStacksCommand({
        StackName: stackName
      });

      const response = await this.cfnClient.send(command);
      const stack = response.Stacks?.[0];

      if (!stack?.Outputs) {
        logger.warning('No stack outputs available');
        return;
      }

      logger.info('\\n🎉 VSCode Server deployed successfully!');
      logger.info('\\n⏳ Waiting for instance and services to be ready...');
      
      // Wait for instance to be ready and VSCode server to be accessible
      await this.waitForInstanceReady(stack);
      
      logger.info('\\n📋 Connection Information:');
      
      for (const output of stack.Outputs) {
        const key = output.OutputKey;
        const value = output.OutputValue;
        const description = output.Description;

        if (key === 'VSCodeURL') {
          logger.success(`🌐 VSCode URL: ${value}`);
        } else if (key === 'PublicIP') {
          logger.info(`🌍 Public IP: ${value}`);
        } else if (key === 'SSHCommand') {
          logger.info(`🔑 SSH Command: ${value}`);
        } else if (key === 'BackupBucket') {
          logger.info(`💾 Backup Bucket: ${value}`);
        } else {
          logger.info(`${key}: ${value}`);
        }
      }

      logger.info('\\n💡 Usage Tips:');
      logger.info('• Access your VSCode server using the URL above');
      logger.info('• Your workspace will be automatically backed up daily');
      logger.info('• Run backup manually: ~/backup-workspace.sh');
      logger.info('• Restore workspace: ~/restore-workspace.sh <backup-filename>');
      logger.info('• Manage instance: yarn start/stop/status');

    } catch (error: any) {
      logger.error(`Failed to get stack outputs: ${error.message}`);
    }
  }

  private async waitForInstanceReady(stack: Stack): Promise<void> {
    try {
      // Get instance ID and VSCode URL from stack outputs
      const instanceId = stack.Outputs?.find(o => o.OutputKey === 'InstanceId')?.OutputValue;
      const vscodeUrl = stack.Outputs?.find(o => o.OutputKey === 'VSCodeURL')?.OutputValue;
      const publicIp = stack.Outputs?.find(o => o.OutputKey === 'PublicIP')?.OutputValue;
      
      if (!instanceId) {
        logger.warning('Instance ID not found in stack outputs');
        return;
      }

      // Wait for EC2 instance to be running
      logger.info('⏳ Waiting for EC2 instance to be running...');
      const { EC2Client, DescribeInstancesCommand } = await import('@aws-sdk/client-ec2');
      const ec2Client = new EC2Client({ region: this.region });
      
      let instanceRunning = false;
      let attempts = 0;
      const maxAttempts = 30; // 5 minutes max
      
      while (!instanceRunning && attempts < maxAttempts) {
        const command = new DescribeInstancesCommand({ InstanceIds: [instanceId] });
        const response = await ec2Client.send(command);
        const instance = response.Reservations?.[0]?.Instances?.[0];
        
        if (instance?.State?.Name === 'running') {
          instanceRunning = true;
          logger.success('✅ EC2 instance is running');
        } else {
          logger.info(`Instance state: ${instance?.State?.Name || 'unknown'}`);
          await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
          attempts++;
        }
      }
      
      if (!instanceRunning) {
        logger.warning('⚠️ Instance did not reach running state within 5 minutes');
        return;
      }

      // Monitor installation progress step by step
      if (publicIp) {
        await this.monitorInstallationProgress(publicIp, vscodeUrl);
      }
      
    } catch (error: any) {
      logger.warning(`Error checking instance readiness: ${error.message}`);
    }
  }

  private async monitorInstallationProgress(publicIp: string, vscodeUrl?: string): Promise<void> {
    logger.info('📦 Monitoring installation progress...');
    
    const installationSteps = [
      { name: 'System Updates', marker: 'Starting cost-optimized code-server installation', timeout: 300 },
      { name: 'Essential Package Downloads', marker: 'Step 2/8: Installing essential system packages', timeout: 60 },
      { name: 'curl Installation', marker: 'Installing curl (web client for downloads)', timeout: 60 },
      { name: 'git Installation', marker: 'Installing git (version control system)', timeout: 60 },
      { name: 'Archive Utilities Installation', marker: 'Installing compression utilities', timeout: 60 },
      { name: 'System Utilities Installation', marker: 'Installing system utilities', timeout: 60 },
      { name: 'Development Tools Installation', marker: 'Installing additional development tools', timeout: 60 },
      { name: 'Package Verification', marker: 'All essential packages verified successfully', timeout: 60 },
      { name: 'AWS CLI Installation', marker: 'Step 3/8: Installing AWS CLI v2', timeout: 240 },
      { name: 'NVM Installation', marker: 'Step 4/8: Installing NVM', timeout: 180 },
      { name: 'Node.js & npm Installation', marker: 'Step 5/8: Installing Node.js via NVM', timeout: 240 },
      { name: 'Yarn Installation', marker: 'Step 6/8: Installing Yarn package manager', timeout: 120 },
      { name: 'Development Environment Setup', marker: 'Step 7/8: Setting up development environment', timeout: 180 },
      { name: 'VS Code Server Installation', marker: 'Step 8/8: Installing VS Code Server', timeout: 300 },
      { name: 'Package Installation Summary', marker: 'All package installations completed successfully', timeout: 60 },
      { name: 'SSL Certificate Generation', marker: 'Generating self-signed SSL certificate', timeout: 120 },
      { name: 'Service Configuration', marker: 'Starting code-server service', timeout: 120 },
      { name: 'Final Verification', marker: 'SUCCESS: code-server service started', timeout: 60 }
    ];

    let currentStep = 0;
    const maxTotalTime = 1200; // 20 minutes total
    const startTime = Date.now();
    
    while (currentStep < installationSteps.length) {
      const step = installationSteps[currentStep];
      const elapsed = (Date.now() - startTime) / 1000;
      
      if (elapsed > maxTotalTime) {
        logger.warning('⚠️ Installation timeout - checking final status...');
        break;
      }
      
      try {
        // Check installation log for current step
        const { spawn } = await import('child_process');
        const checkLog = spawn('ssh', [
          '-i', 'ec2-vscode-server-dev-key.pem',
          '-o', 'StrictHostKeyChecking=no',
          '-o', 'ConnectTimeout=10',
          `ec2-user@${publicIp}`,
          `sudo tail -50 /var/log/code-server-install.log 2>/dev/null || echo "LOG_NOT_FOUND"`
        ]);
        
        let logOutput = '';
        checkLog.stdout.on('data', (data) => {
          logOutput += data.toString();
        });
        
        const logCheckPromise = new Promise<void>((resolve) => {
          checkLog.on('close', () => resolve());
        });
        
        await Promise.race([
          logCheckPromise,
          new Promise(resolve => setTimeout(resolve, 15000)) // 15 second timeout for SSH
        ]);
        
        if (logOutput.includes(step.marker)) {
          logger.success(`✅ ${step.name} completed`);
          currentStep++;
          
          // Special handling for specific steps
          if (step.name === 'VS Code Server Installation') {
            await this.checkCodeServerInstallation(publicIp);
          } else if (step.name === 'Service Configuration') {
            await this.checkServiceStatus(publicIp);
          } else if (step.name === 'Package Installation Summary') {
            logger.info('📋 All development tools and packages have been installed');
          }
        } else if (logOutput.includes('ERROR:') || logOutput.includes('FAILED:')) {
          logger.warning(`⚠️ ${step.name} may have encountered issues`);
          await this.diagnoseInstallationIssues(publicIp, logOutput);
        } else {
          logger.info(`⏳ ${step.name} in progress... (${Math.floor(elapsed)}s elapsed)`);
        }
        
      } catch (error: any) {
        logger.warning(`Cannot check installation progress: ${error.message}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds between checks
    }

    // Final VS Code server accessibility check
    if (vscodeUrl) {
      logger.info('🌐 Checking VS Code server accessibility...');
      await this.checkVSCodeServerReady(vscodeUrl);
    }
  }

  private async checkCodeServerInstallation(publicIp: string): Promise<void> {
    try {
      const { spawn } = await import('child_process');
      const checkCommand = spawn('ssh', [
        '-i', 'ec2-vscode-server-dev-key.pem',
        '-o', 'StrictHostKeyChecking=no',
        `ec2-user@${publicIp}`,
        'command -v code-server && code-server --version'
      ]);
      
      let output = '';
      checkCommand.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      const checkPromise = new Promise<void>((resolve) => {
        checkCommand.on('close', (code) => {
          if (code === 0 && output.includes('code-server')) {
            logger.success('✅ Code-server binary verified');
          } else {
            logger.warning('⚠️ Code-server binary not found or not working');
          }
          resolve();
        });
      });
      
      await Promise.race([
        checkPromise,
        new Promise(resolve => setTimeout(resolve, 10000))
      ]);
      
    } catch (error: any) {
      logger.warning(`Could not verify code-server installation: ${error.message}`);
    }
  }

  private async checkServiceStatus(publicIp: string): Promise<void> {
    try {
      const { spawn } = await import('child_process');
      const checkService = spawn('ssh', [
        '-i', 'ec2-vscode-server-dev-key.pem',
        '-o', 'StrictHostKeyChecking=no',
        `ec2-user@${publicIp}`,
        'sudo systemctl is-active code-server@ec2-user && sudo systemctl status code-server@ec2-user --no-pager -l'
      ]);
      
      let output = '';
      checkService.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      const servicePromise = new Promise<void>((resolve) => {
        checkService.on('close', (code) => {
          if (output.includes('active')) {
            logger.success('✅ Code-server service is active');
          } else {
            logger.warning('⚠️ Code-server service not active yet');
            logger.info(`Service status output: ${output.substring(0, 200)}`);
          }
          resolve();
        });
      });
      
      await Promise.race([
        servicePromise,
        new Promise(resolve => setTimeout(resolve, 10000))
      ]);
      
    } catch (error: any) {
      logger.warning(`Could not check service status: ${error.message}`);
    }
  }

  private async diagnoseInstallationIssues(publicIp: string, logOutput: string): Promise<void> {
    logger.info('🔍 Diagnosing installation issues...');
    
    // Check for common issues
    if (logOutput.includes('curl') && logOutput.includes('ERROR')) {
      logger.warning('⚠️ Network connectivity issues detected');
    }
    if (logOutput.includes('npm') && logOutput.includes('ERROR')) {
      logger.warning('⚠️ NPM installation issues detected');
    }
    if (logOutput.includes('Permission denied')) {
      logger.warning('⚠️ Permission issues detected');
    }
    if (logOutput.includes('No space left')) {
      logger.warning('⚠️ Disk space issues detected');
    }
    
    // Show last few lines of log for debugging
    const lines = logOutput.split('\n').slice(-5);
    logger.info('Last log entries:');
    lines.forEach(line => {
      if (line.trim()) {
        logger.info(`  ${line}`);
      }
    });
  }

  private async checkVSCodeServerReady(vscodeUrl: string): Promise<void> {
    let vscodeReady = false;
    let attempts = 0;
    const maxAttempts = 12; // 2 minutes max for final check
    
    while (!vscodeReady && attempts < maxAttempts) {
      try {
        // Use curl to check if VSCode server is responding
        const { execSync } = await import('child_process');
        execSync(`curl -s --max-time 5 --head "${vscodeUrl}" > /dev/null`, { stdio: 'ignore' });
        vscodeReady = true;
        logger.success('✅ VS Code server is accessible');
      } catch (error) {
        logger.info(`🔄 VS Code server connectivity check ${attempts + 1}/${maxAttempts}...`);
        await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
        attempts++;
      }
    }
    
    if (!vscodeReady) {
      logger.warning('⚠️ VS Code server not immediately accessible');
      logger.info('💡 The server may still be starting up. Try accessing it in a few minutes.');
      logger.info('💡 You can check the installation log with: yarn deployment-menu -> "Tail code-server install log"');
    }
  }
}
