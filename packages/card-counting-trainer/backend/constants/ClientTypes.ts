/**
 * Cognito User Groups for Card Counting Trainer
 */
export const COGNITO_GROUPS = ["admin", "user"];

export type CognitoGroup = (typeof COGNITO_GROUPS)[number];
