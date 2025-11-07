import { fetchAuthSession } from "aws-amplify/auth";
import {
  FacebookOAuthSecretsSchema,
  type FacebookOAuthSecrets,
} from "@/types/FacebookOAuthSecretsSchemas";

const FACEBOOK_OAUTH_SECRETS_API_BASE_URL =
  process.env.NEXT_PUBLIC_PATREON_API_URL || "";

if (!FACEBOOK_OAUTH_SECRETS_API_BASE_URL) {
  console.error(
    "NEXT_PUBLIC_PATREON_API_URL is not set. This will be populated after deploying the stack. Restart the dev server after deployment to pick up the new value.",
  );
}

/**
 * Get authorization header with Cognito JWT token
 * Uses access token because it contains cognito:groups claim
 */
async function getAuthHeader(): Promise<Record<string, string>> {
  const session = await fetchAuthSession();
  const token = session.tokens?.accessToken?.toString();

  if (!token) {
    throw new Error("No authentication token available");
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

/**
 * Fetch current Facebook OAuth secrets (masked values)
 * @returns Current Facebook OAuth secrets with masked sensitive values
 */
export async function getFacebookOAuthSecretsAPI(): Promise<FacebookOAuthSecrets> {
  if (!FACEBOOK_OAUTH_SECRETS_API_BASE_URL) {
    throw new Error(
      "Facebook OAuth API URL is not configured. Deploy the stack to configure it, then restart the dev server.",
    );
  }

  const authHeader = await getAuthHeader();

  const response = await fetch(
    `${FACEBOOK_OAUTH_SECRETS_API_BASE_URL}/admin/facebook-oauth/secrets`,
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
      errorData.error ||
        `Failed to fetch Facebook OAuth secrets: ${response.status}`,
    );
  }

  const data = await response.json();

  // Validate response with Zod
  return FacebookOAuthSecretsSchema.parse(data);
}

/**
 * Update Facebook OAuth secrets in AWS Secrets Manager (admin only)
 * @param secrets - Partial or complete secrets object (supports updating individual fields)
 * @returns Success response
 */
export async function updateFacebookOAuthSecretsAPI(
  secrets: Partial<FacebookOAuthSecrets>,
): Promise<{ success: boolean; message: string }> {
  if (!FACEBOOK_OAUTH_SECRETS_API_BASE_URL) {
    throw new Error(
      "Facebook OAuth API URL is not configured. Deploy the stack to configure it, then restart the dev server.",
    );
  }

  const authHeader = await getAuthHeader();

  const response = await fetch(
    `${FACEBOOK_OAUTH_SECRETS_API_BASE_URL}/admin/facebook-oauth/secrets`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeader,
      },
      body: JSON.stringify(secrets),
    },
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error ||
        `Failed to update Facebook OAuth secrets: ${response.status}`,
    );
  }

  const data = await response.json();
  return data as { success: boolean; message: string };
}
