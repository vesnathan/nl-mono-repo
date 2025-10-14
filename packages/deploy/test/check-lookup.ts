import { join } from 'path';
import { OutputsManager } from '../outputs-manager';
import { candidateExportNames } from '../utils/export-names';
import { StackType } from '../types';

async function main() {
  // Copy the fake file into the place OutputsManager expects by reading it and writing to the outputs-manager path
  const fs = await import('fs');
  const src = join(__dirname, 'fake-deployment-outputs.json');
  const dst = join(__dirname, '..', 'deployment-outputs.json');
  fs.copyFileSync(src, dst);
  console.log('Wrote fake deployment-outputs.json for test');

  const outputsManager = new OutputsManager();
  const candidates = candidateExportNames(StackType.AwsExample, 'dev', 'user-pool-id');
  console.log('Candidates:', candidates);
  const val = await outputsManager.findOutputValueByCandidates('dev', candidates);
  console.log('Lookup result:', val);
}

main().catch((e) => {
  console.error('Test failed:', e);
  process.exit(1);
});
