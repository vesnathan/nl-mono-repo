import { client } from "@/lib/amplify";
import { getUserProfile } from "@/graphql/queries";
import { UserSchema, type User } from "@/types/ValidationSchemas";

export async function getUserProfileAPI(userId: string): Promise<User | null> {
  const result = await client.graphql({
    query: getUserProfile,
    variables: { userId },
  });
  if (!result.data.getUserProfile) return null;
  return UserSchema.parse(result.data.getUserProfile);
}
