const { deployCwl } = require('./packages/cwl/cwl.ts');

console.log('Starting test...');

deployCwl({ stage: 'dev' })
  .then(() => console.log('Success'))
  .catch(err => console.error('Error:', err));
