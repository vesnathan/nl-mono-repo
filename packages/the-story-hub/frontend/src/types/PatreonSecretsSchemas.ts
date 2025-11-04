import { z } from "zod";

/**
 * Patreon Secrets Schemas
 * Zod schemas for validating Patreon secrets API responses
 */

// Response Schema for PatreonSecrets (masked values)
export const PatreonSecretsSchema = z.object({
  creatorAccessToken: z.string(),
  webhookSecret: z.string(),
  campaignId: z.string(),
  clientId: z.string(),
  clientSecret: z.string(),
});

export type PatreonSecrets = z.infer<typeof PatreonSecretsSchema>;

// Input Schema for UpdatePatreonSecrets
export const UpdatePatreonSecretsInputSchema = z.object({
  creatorAccessToken: z.string().optional(),
  webhookSecret: z.string().optional(),
  campaignId: z.string().optional(),
  clientId: z.string().optional(),
  clientSecret: z.string().optional(),
});

export type UpdatePatreonSecretsInput = z.infer<
  typeof UpdatePatreonSecretsInputSchema
>;
