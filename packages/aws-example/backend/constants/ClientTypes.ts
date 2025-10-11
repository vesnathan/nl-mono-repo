/**
 * AWSB Client Types - Single Source of Truth
 *
 * This file defines all client types used throughout the AWS Example application.
 * Any changes to client types should be made here and will automatically
 * propagate to:
 * - GraphQL schema enum
 * - Cognito user groups
 * - TypeScript types
 * - Resolver mappings
 * - UI display names
 */

export interface ClientTypeDefinition {
  id: string;
  value: string;
  displayName: string;
  description?: string;
}

export const AWSB_CLIENT_TYPES: readonly ClientTypeDefinition[] = [
  {
    id: "SiteAdmin",
    value: "SiteAdmin",
    displayName: "Site Admin",
    description: "Site administrator with full access",
  },
  {
    id: "AuthenticatedUser",
    value: "AuthenticatedUser",
    displayName: "Authenticated User",
    description: "Authenticated user",
  },
  {
    id: "UnauthenticatedUser",
    value: "UnauthenticatedUser",
    displayName: "Unauthenticated User",
    description: "Guest user without authentication",
  },
] as const;

export type AWSBClientType = (typeof AWSB_CLIENT_TYPES)[number]["value"];

// Helper to check if a string is a valid client type
export const isValidAWSBClientType = (
  value: string,
): value is AWSBClientType => {
  return AWSB_CLIENT_TYPES.some((type) => type.value === value);
};

// Get display name for a client type value
export const getClientTypeDisplayName = (value: string): string => {
  const clientType = AWSB_CLIENT_TYPES.find((type) => type.value === value);
  return clientType?.displayName || value;
};

// For use in Cognito group creation - extract just the values
export const AWSB_COGNITO_GROUPS = AWSB_CLIENT_TYPES.map((type) => type.value);

// For GraphQL schema generation - extract just the values
export const AWSB_CLIENT_TYPE_ENUM_VALUES = AWSB_CLIENT_TYPES.map(
  (type) => type.value,
);
