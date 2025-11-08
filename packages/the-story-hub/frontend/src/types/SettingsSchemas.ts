import { z } from "zod";

/**
 * Site Settings Schemas
 * Zod schemas for validating site settings API responses
 */

// Response Schema for SiteSettings
export const SiteSettingsSchema = z.object({
  __typename: z.literal("SiteSettings").optional(),
  grantOGBadgeToPatreonSupporters: z.boolean(),
  googleOAuthEnabled: z.boolean(),
  facebookOAuthEnabled: z.boolean(),
  appleOAuthEnabled: z.boolean(),
  adsEnabled: z.boolean(),
  adsensePublisherId: z.string().nullable(),
  adsenseVerificationCode: z.string().nullable(),
  showAdsOnHomepage: z.boolean(),
  showAdsOnStoryEnd: z.boolean(),
  showAdsInFooter: z.boolean(),
  homepageAdSlot: z.string().nullable(),
  storyEndAdSlot: z.string().nullable(),
  footerAdSlot: z.string().nullable(),
  sentryDsn: z.string().nullable(),
  sentryEnabled: z.boolean(),
  updatedAt: z.string(),
  updatedBy: z.string().nullable(),
});

export type SiteSettings = z.infer<typeof SiteSettingsSchema>;

// Input Schema for UpdateSiteSettings mutation
export const UpdateSiteSettingsInputSchema = z.object({
  grantOGBadgeToPatreonSupporters: z.boolean().optional(),
  googleOAuthEnabled: z.boolean().optional(),
  facebookOAuthEnabled: z.boolean().optional(),
  appleOAuthEnabled: z.boolean().optional(),
  adsEnabled: z.boolean().optional(),
  adsensePublisherId: z.string().optional(),
  adsenseVerificationCode: z.string().optional(),
  showAdsOnHomepage: z.boolean().optional(),
  showAdsOnStoryEnd: z.boolean().optional(),
  showAdsInFooter: z.boolean().optional(),
  sentryDsn: z.string().optional(),
  sentryEnabled: z.boolean().optional(),
  // Future settings can be added here
});

export type UpdateSiteSettingsInput = z.infer<
  typeof UpdateSiteSettingsInputSchema
>;
