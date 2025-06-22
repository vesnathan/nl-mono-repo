/**
 * CWL Client Types - Single Source of Truth
 * 
 * This file defines all client types used throughout the CloudWatch Live application.
 * Any changes to client types should be made here and will automatically
 * propagate to:
 * - GraphQL schema enum
 * - Cognito user groups
 * - TypeScript types
 * - Resolver mappings
 */

export const CWL_CLIENT_TYPES = [
  'SuperAdmin',
  'EventCompanyAdmin', 
  'EventCompanyStaff',
  'TechCompanyAdmin',
  'TechCompanyStaff', 
  'RegisteredAttendee',
  'UnregisteredAttendee'
] as const;

export type CWLClientType = typeof CWL_CLIENT_TYPES[number];

// Helper to check if a string is a valid client type
export const isValidCWLClientType = (value: string): value is CWLClientType => {
  return CWL_CLIENT_TYPES.includes(value as CWLClientType);
};

// For use in Cognito group creation
export const CWL_COGNITO_GROUPS = CWL_CLIENT_TYPES;

// For GraphQL schema generation
export const CWL_CLIENT_TYPE_ENUM_VALUES = CWL_CLIENT_TYPES;
