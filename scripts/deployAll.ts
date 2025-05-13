import { spawnSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

const rootDir = path.resolve(__dirname, '..');

/**
 * Execute a command in a specific directory
 */
function execute(command: string, cwd: string, env: Record<string, string> = {}): void {
  console.log(`\n> Executing: ${command} in ${cwd}`);
  
  const result = spawnSync(command, {
    shell: true,
    cwd,
    stdio: 'inherit',
    env: { ...process.env, ...env }
  });

  if (result.status !== 0) {
    console.error(`Command failed with exit code ${result.status}`);
    process.exit(result.status || 1);
  }
}

/**
 * Deploy in the correct order
 */
async function deployAll() {
  const stage = process.env.STAGE || 'dev';
  console.log(`\n=== Deploying all stacks for stage ${stage} ===\n`);
  
  // Check if AWS profiles exist
  if (!process.env.AWS_PROFILE_WAF) {
    console.warn('AWS_PROFILE_WAF not set. Using default "nlmonorepo-waf-dev" profile.');
  }
  if (!process.env.AWS_PROFILE_SHARED) {
    console.warn('AWS_PROFILE_SHARED not set. Using default "nlmonorepo-shared-dev" profile.');
  } 
  if (!process.env.AWS_PROFILE_CWL) {
    console.warn('AWS_PROFILE_CWL not set. Using default "nlmonorepo-cwl-dev" profile.');
  }
  
  const wafProfile = process.env.AWS_PROFILE_WAF || `nlmonorepo-waf-${stage}`;
  const sharedProfile = process.env.AWS_PROFILE_SHARED || `nlmonorepo-shared-${stage}`;
  const cwlProfile = process.env.AWS_PROFILE_CWL || `nlmonorepo-cwl-${stage}`;

  try {
    // 1. Deploy WAF
    console.log('\n=== Step 1: Deploying WAF ===');
    const wafDir = path.join(rootDir, 'packages/cwl-waf');
    execute('yarn deploy-waf', wafDir, { 
      STAGE: stage,
      AWS_PROFILE: wafProfile
    });
    
    // 2. Deploy Shared AWS Assets
    console.log('\n=== Step 2: Deploying Shared AWS Assets ===');
    const sharedDir = path.join(rootDir, 'packages/shared-aws-assets');
    execute('yarn deploy-shared', sharedDir, { 
      STAGE: stage,
      AWS_PROFILE: sharedProfile
    });
    
    // 3. Deploy CloudWatchLive Backend
    console.log('\n=== Step 3: Deploying CloudWatchLive Backend ===');
    const cwlDir = path.join(rootDir, 'packages/cloudwatchlive/backend');
    execute('yarn deploy', cwlDir, { 
      STAGE: stage,
      AWS_PROFILE: cwlProfile
    });

    // 4. Run CloudWatchLive Backend Post-Deploy
    console.log('\n=== Step 4: Running CloudWatchLive Backend Post-Deploy ===');
    execute('yarn post-deploy', cwlDir, { 
      STAGE: stage,
      AWS_PROFILE: cwlProfile
    });

    console.log('\n=== All stacks deployed successfully! ===\n');
  } catch (error) {
    console.error('Deployment failed:', error);
    process.exit(1);
  }
}

deployAll();
