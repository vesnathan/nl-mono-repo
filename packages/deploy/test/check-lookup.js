const path = require('path');
const fs = require('fs');

// Use ts-node to require TS modules if needed
require('ts-node').register({ transpileOnly: true });

const { OutputsManager } = require('../outputs-manager');
const { candidateExportNames } = require('../utils/export-names');
const { StackType } = require('../types');

async function main() {
  const src = path.join(__dirname, 'fake-deployment-outputs.json');
  const dst = path.join(__dirname, '..', 'deployment-outputs.json');
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
