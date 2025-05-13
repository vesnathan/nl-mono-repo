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
    console.error('Continuing with removal process anyway...');
    // Don't exit on failure so we can try to remove other stacks
  }
}

/**
 * Remove in reverse order
 */
async function removeAll() {
  const stage = process.env.STAGE || 'dev';
  console.log(`\n=== Removing all stacks for stage ${stage} ===\n`);
  
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
    // REVERSE ORDER for removal
    
    // 1. Remove CloudWatchLive Backend
    console.log('\n=== Step 1: Removing CloudWatchLive Backend ===');
    const cwlDir = path.join(rootDir, 'packages/cloudwatchlive/backend');
    execute('yarn remove-cwl', cwlDir, { 
      STAGE: stage,
      AWS_PROFILE: cwlProfile
    });
    
    // 2. Remove Shared AWS Assets
    console.log('\n=== Step 2: Removing Shared AWS Assets ===');
    const sharedDir = path.join(rootDir, 'packages/shared-aws-assets');
    execute('yarn remove-shared', sharedDir, { 
      STAGE: stage,
      AWS_PROFILE: sharedProfile
    });
    
    // 3. Remove WAF
    console.log('\n=== Step 3: Removing WAF ===');
    const wafDir = path.join(rootDir, 'packages/cwl-waf');
    execute('yarn remove-waf', wafDir, { 
      STAGE: stage,
      AWS_PROFILE: wafProfile
    });

    console.log('\n=== All stacks removed successfully! ===\n');
  } catch (error) {
    console.error('Removal failed:', error);
    process.exit(1);
  }
}

removeAll();
