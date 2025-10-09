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
 * - UI display names
 */

export interface ClientTypeDefinition {
  id: string;
  value: string;
  displayName: string;
  description?: string;
}

export const CWL_CLIENT_TYPES: readonly ClientTypeDefinition[] = [
  {
    id: "SuperAdmin",
    value: "SuperAdmin",
    displayName: "Super Admin",
    description: "Full system administrator access",
  },
  {
    id: "EventCompanyMainAdmin",
    value: "EventCompanyMainAdmin",
    displayName: "Event Company Main Admin",
    description: "Main administrator managing Event Company Admins",
  },
  {
    id: "EventCompanyAdmin",
    value: "EventCompanyAdmin",
    displayName: "Event Company Admin",
    description: "Event company administrator managing staff",
  },
  {
    id: "EventCompanyStaff",
    value: "EventCompanyStaff",
    displayName: "Event Company Staff",
    description: "Event company staff member",
  },
  {
    id: "TechCompanyAdmin",
    value: "TechCompanyAdmin",
    displayName: "Tech Company Admin",
    description: "Technology company administrator",
  },
  {
    id: "TechCompanyStaff",
    value: "TechCompanyStaff",
    displayName: "Tech Company Staff",
    description: "Technology company staff member",
  },
  {
    id: "RegisteredAttendee",
    value: "RegisteredAttendee",
    displayName: "Registered Attendee",
    description: "Registered event attendee",
  },
  {
    id: "UnregisteredAttendee",
    value: "UnregisteredAttendee",
    displayName: "Unregistered Attendee",
    description: "Unregistered event attendee",
  },
] as const;

export type CWLClientType = (typeof CWL_CLIENT_TYPES)[number]["value"];

// Helper to check if a string is a valid client type
export const isValidCWLClientType = (value: string): value is CWLClientType => {
  return CWL_CLIENT_TYPES.some((type) => type.value === value);
};

// Get display name for a client type value
export const getClientTypeDisplayName = (value: string): string => {
  const clientType = CWL_CLIENT_TYPES.find((type) => type.value === value);
  return clientType?.displayName || value;
};

// For use in Cognito group creation - extract just the values
export const CWL_COGNITO_GROUPS = CWL_CLIENT_TYPES.map((type) => type.value);

// For GraphQL schema generation - extract just the values
export const CWL_CLIENT_TYPE_ENUM_VALUES = CWL_CLIENT_TYPES.map(
  (type) => type.value,
);
