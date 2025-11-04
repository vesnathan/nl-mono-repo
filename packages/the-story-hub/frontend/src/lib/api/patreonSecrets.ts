import { fetchAuthSession } from "aws-amplify/auth";
import {
  PatreonSecretsSchema,
  UpdatePatreonSecretsInputSchema,
  type PatreonSecrets,
  type UpdatePatreonSecretsInput,
} from "@/types/PatreonSecretsSchemas";

const PATREON_SECRETS_API_BASE_URL =
  process.env.NEXT_PUBLIC_PATREON_API_URL ||
  "https://your-api-gateway-url.execute-api.region.amazonaws.com/dev";

/**
 * Get authorization header with Cognito JWT token
 */
async function getAuthHeader(): Promise<Record<string, string>> {
  const session = await fetchAuthSession();
  const token = session.tokens?.idToken?.toString();

  if (!token) {
    throw new Error("No authentication token available");
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

/**
 * Fetch current Patreon secrets (masked values)
 * @returns Current Patreon secrets with masked sensitive values
 */
export async function getPatreonSecretsAPI(): Promise<PatreonSecrets> {
  const authHeader = await getAuthHeader();

  const response = await fetch(
    `${PATREON_SECRETS_API_BASE_URL}/admin/patreon/secrets`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...authHeader,
      },
    },
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `Failed to fetch Patreon secrets: ${response.status}`,
    );
  }

  const data = await response.json();

  // Validate response with Zod
  return PatreonSecretsSchema.parse(data);
}

/**
 * Update Patreon secrets in AWS Secrets Manager (admin only)
 * @param input - Secrets to update (only provide fields you want to update)
 * @returns Success response
 */
export async function updatePatreonSecretsAPI(
  input: UpdatePatreonSecretsInput,
): Promise<{ success: boolean; message: string }> {
  // Validate input with Zod
  UpdatePatreonSecretsInputSchema.parse(input);

  const authHeader = await getAuthHeader();

  const response = await fetch(
    `${PATREON_SECRETS_API_BASE_URL}/admin/patreon/secrets`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeader,
      },
      body: JSON.stringify(input),
    },
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `Failed to update Patreon secrets: ${response.status}`,
    );
  }

  const data = await response.json();
  return data as { success: boolean; message: string };
}
