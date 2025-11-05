import { client } from "@/lib/amplify";
import { getSiteSettings, updateSiteSettings } from "@/graphql/settings";
import {
  SiteSettingsSchema,
  UpdateSiteSettingsInputSchema,
  type SiteSettings,
  type UpdateSiteSettingsInput,
} from "@/types/SettingsSchemas";

// API Functions

/**
 * Fetch current site settings
 * @returns Current site settings
 */
export async function getSiteSettingsAPI(): Promise<SiteSettings> {
  const response = await client.graphql({
    query: getSiteSettings,
  });

  // Validate response with Zod
  return SiteSettingsSchema.parse(
    (response as { data: { getSiteSettings: unknown } }).data.getSiteSettings,
  );
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
    query: updateSiteSettings,
    variables: { input },
    authMode: "userPool", // Must use Cognito User Pools for admin operations
  });

  // Validate response with Zod
  return SiteSettingsSchema.parse(
    (response as { data: { updateSiteSettings: unknown } }).data
      .updateSiteSettings,
  );
}
