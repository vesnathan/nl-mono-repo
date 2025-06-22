// Test if environment variables are loaded
console.log('=== ENVIRONMENT VARIABLES TEST ===');
console.log('NEXT_PUBLIC_USER_POOL_ID:', process.env.NEXT_PUBLIC_USER_POOL_ID);
console.log('NEXT_PUBLIC_USER_POOL_CLIENT_ID:', process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID);
console.log('NEXT_PUBLIC_IDENTITY_POOL_ID:', process.env.NEXT_PUBLIC_IDENTITY_POOL_ID);
console.log('NEXT_PUBLIC_GRAPHQL_URL:', process.env.NEXT_PUBLIC_GRAPHQL_URL);
console.log('NEXT_PUBLIC_ENVIRONMENT:', process.env.NEXT_PUBLIC_ENVIRONMENT);
console.log('===================================');

// Test the Amplify configuration
import { AMPLIFY_CONFIG } from '@/config/amplifyConfig';

console.log('=== AMPLIFY CONFIG TEST ===');
console.log('Auth.Cognito.userPoolId:', AMPLIFY_CONFIG.Auth?.Cognito?.userPoolId);
console.log('Auth.Cognito.userPoolClientId:', AMPLIFY_CONFIG.Auth?.Cognito?.userPoolClientId);
console.log('Auth.Cognito.identityPoolId:', AMPLIFY_CONFIG.Auth?.Cognito?.identityPoolId);
console.log('API.GraphQL.endpoint:', AMPLIFY_CONFIG.API?.GraphQL?.endpoint);
console.log('===========================');

export default function EnvTest() {
  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Environment Variables Test</h1>
      <p>Check the browser console for detailed logging.</p>
      
      <h2>Environment Variables</h2>
      <ul>
        <li>USER_POOL_ID: {process.env.NEXT_PUBLIC_USER_POOL_ID || 'NOT SET'}</li>
        <li>USER_POOL_CLIENT_ID: {process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID || 'NOT SET'}</li>
        <li>IDENTITY_POOL_ID: {process.env.NEXT_PUBLIC_IDENTITY_POOL_ID || 'NOT SET'}</li>
        <li>GRAPHQL_URL: {process.env.NEXT_PUBLIC_GRAPHQL_URL || 'NOT SET'}</li>
        <li>ENVIRONMENT: {process.env.NEXT_PUBLIC_ENVIRONMENT || 'NOT SET'}</li>
      </ul>
      
      <h2>Amplify Configuration</h2>
      <ul>
        <li>userPoolId: {AMPLIFY_CONFIG.Auth?.Cognito?.userPoolId || 'NOT SET'}</li>
        <li>userPoolClientId: {AMPLIFY_CONFIG.Auth?.Cognito?.userPoolClientId || 'NOT SET'}</li>
        <li>identityPoolId: {AMPLIFY_CONFIG.Auth?.Cognito?.identityPoolId || 'NOT SET'}</li>
        <li>GraphQL endpoint: {AMPLIFY_CONFIG.API?.GraphQL?.endpoint || 'NOT SET'}</li>
      </ul>
    </div>
  );
}
