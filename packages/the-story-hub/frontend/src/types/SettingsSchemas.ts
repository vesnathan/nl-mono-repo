import { z } from "zod";

/**
 * Site Settings Schemas
 * Zod schemas for validating site settings API responses
 */

// Response Schema for SiteSettings
export const SiteSettingsSchema = z.object({
  __typename: z.literal("SiteSettings").optional(),
  grantOGBadgeToPatreonSupporters: z.boolean(),
  updatedAt: z.string(),
  updatedBy: z.string().nullable(),
});

export type SiteSettings = z.infer<typeof SiteSettingsSchema>;

// Input Schema for UpdateSiteSettings mutation
export const UpdateSiteSettingsInputSchema = z.object({
  grantOGBadgeToPatreonSupporters: z.boolean().optional(),
  // Future settings can be added here
});

export type UpdateSiteSettingsInput = z.infer<
  typeof UpdateSiteSettingsInputSchema
>;
