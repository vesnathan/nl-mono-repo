import { client } from "@/lib/amplify";
import { getUserProfile } from "@/graphql/queries";
import type { User } from "@/types/gqlTypes";

export async function getUserProfileAPI(userId: string): Promise<User | null> {
  const result = await client.graphql({
    query: getUserProfile,
    variables: { userId },
  });
  return result.data.getUserProfile ?? null;
}
