import { client } from "@/lib/amplify";
import {
  SiteSettingsSchema,
  UpdateSiteSettingsInputSchema,
  type SiteSettings,
  type UpdateSiteSettingsInput,
} from "@/types/SettingsSchemas";

// GraphQL Queries
const GET_SITE_SETTINGS = /* GraphQL */ `
  query GetSiteSettings {
    getSiteSettings {
      grantOGBadgeToPatreonSupporters
      updatedAt
      updatedBy
    }
  }
`;

// GraphQL Mutations
const UPDATE_SITE_SETTINGS = /* GraphQL */ `
  mutation UpdateSiteSettings($input: UpdateSiteSettingsInput!) {
    updateSiteSettings(input: $input) {
      grantOGBadgeToPatreonSupporters
      updatedAt
      updatedBy
    }
  }
`;

// API Functions

/**
 * Fetch current site settings
 * @returns Current site settings
 */
export async function getSiteSettingsAPI(): Promise<SiteSettings> {
  const response = await client.graphql({
    query: GET_SITE_SETTINGS,
  });

  // Validate response with Zod
  return SiteSettingsSchema.parse((response as any).data.getSiteSettings);
}

/**
 * Update site settings (admin only)
 * @param input - Settings to update
 * @returns Updated site settings
 */
export async function updateSiteSettingsAPI(
  input: UpdateSiteSettingsInput,
): Promise<SiteSettings> {
  // Validate input with Zod
  UpdateSiteSettingsInputSchema.parse(input);

  const response = await client.graphql({
    query: UPDATE_SITE_SETTINGS,
    variables: { input },
  });

  // Validate response with Zod
  return SiteSettingsSchema.parse((response as any).data.updateSiteSettings);
}
