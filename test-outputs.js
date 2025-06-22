const { readFileSync } = require('fs');
const { join } = require('path');

console.log('Testing deployment outputs reading...');

const outputPath = join(__dirname, 'packages/deploy/deployment-outputs.json');
console.log('Looking for file at:', outputPath);

try {
  const fileContent = readFileSync(outputPath, 'utf-8');
  const outputs = JSON.parse(fileContent);
  
  console.log('Found deployment outputs for stage:', outputs.stage);
  console.log('Available stacks:', Object.keys(outputs.stacks));
  
  const cwlStack = outputs.stacks.cwl || outputs.stacks.CWL;
  console.log('CWL stack found:', !!cwlStack);
  
  if (cwlStack) {
    const getValue = (key) => cwlStack.outputs.find(o => o.OutputKey === key)?.OutputValue || '';
    
    console.log('\nEnvironment variables that should be set:');
    console.log('NEXT_PUBLIC_USER_POOL_ID:', getValue('CWLUserPoolId'));
    console.log('NEXT_PUBLIC_USER_POOL_CLIENT_ID:', getValue('CWLUserPoolClientId'));
    console.log('NEXT_PUBLIC_IDENTITY_POOL_ID:', getValue('CWLIdentityPoolId'));
    console.log('NEXT_PUBLIC_GRAPHQL_URL:', getValue('ApiUrl'));
  }
} catch (error) {
  console.error('Error reading deployment outputs:', error.message);
}
