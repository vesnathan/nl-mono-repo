/**
 * ANA Client Types - Single Source of Truth
 *
 * This file defines all client types used throughout the A New App application.
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

export const ANA_CLIENT_TYPES: readonly ClientTypeDefinition[] = [
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

export type ANAClientType = (typeof ANA_CLIENT_TYPES)[number]["value"];

// Helper to check if a string is a valid client type
export const isValidANAClientType = (
  value: string,
): value is ANAClientType => {
  return ANA_CLIENT_TYPES.some((type) => type.value === value);
};

// Get display name for a client type value
export const getClientTypeDisplayName = (value: string): string => {
  const clientType = ANA_CLIENT_TYPES.find((type) => type.value === value);
  return clientType?.displayName || value;
};

// For use in Cognito group creation - extract just the values
export const ANA_COGNITO_GROUPS = ANA_CLIENT_TYPES.map((type) => type.value);

// For GraphQL schema generation - extract just the values
export const ANA_CLIENT_TYPE_ENUM_VALUES = ANA_CLIENT_TYPES.map(
  (type) => type.value,
);
