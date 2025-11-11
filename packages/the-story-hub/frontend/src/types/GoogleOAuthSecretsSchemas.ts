import { z } from "zod";

/**
 * Google OAuth Secrets Schemas
 * Zod schemas for validating Google OAuth secrets API responses
 */

// Response Schema for GoogleOAuthSecrets (masked values)
export const GoogleOAuthSecretsSchema = z.object({
  clientId: z.string(),
  clientSecret: z.string(),
});

export type GoogleOAuthSecrets = z.infer<typeof GoogleOAuthSecretsSchema>;

// Input Schema for UpdateGoogleOAuthSecrets
export const UpdateGoogleOAuthSecretsInputSchema = z.object({
  clientId: z.string().optional(),
  clientSecret: z.string().optional(),
});

export type UpdateGoogleOAuthSecretsInput = z.infer<
  typeof UpdateGoogleOAuthSecretsInputSchema
>;
