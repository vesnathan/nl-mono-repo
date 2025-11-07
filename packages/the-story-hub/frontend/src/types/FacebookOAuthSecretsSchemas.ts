import { z } from "zod";

export const FacebookOAuthSecretsSchema = z.object({
  clientId: z.string(),
  clientSecret: z.string(),
});

export type FacebookOAuthSecrets = z.infer<typeof FacebookOAuthSecretsSchema>;
