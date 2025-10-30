import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/api';
import { AMPLIFY_CONFIG } from '@/config/amplifyConfig';

// Configure Amplify (call this once in app/layout.tsx)
export function configureAmplify() {
  Amplify.configure(AMPLIFY_CONFIG, { ssr: true });
}

// Generate GraphQL client
export const client = generateClient();
