import { client } from "@/lib/amplify";
import { UserSchema, type User } from "@/types/ValidationSchemas";

// Custom query with all User fields including patreonInfo and settings
const getUserProfileQuery = /* GraphQL */ `
  query GetUserProfile($userId: ID!) {
    getUserProfile(userId: $userId) {
      userId
      username
      email
      bio
      stats {
        storiesCreated
        branchesContributed
        totalUpvotes
        __typename
      }
      patreonSupporter
      patreonInfo {
        tier
        patreonUserId
        lastSynced
        __typename
      }
      ogSupporter
      clientType
      createdAt
      privacySettings {
        profileVisibility
        showStats
        __typename
      }
      notificationSettings {
        emailNotifications
        notifyOnReply
        notifyOnUpvote
        notifyOnStoryUpdate
        notificationFrequency
        __typename
      }
      contentSettings {
        defaultAgeRatingFilter
        hideAIContent
        autoSaveEnabled
        __typename
      }
      __typename
    }
  }
`;

export async function getUserProfileAPI(userId: string): Promise<User | null> {
  const result = await client.graphql({
    query: getUserProfileQuery,
    variables: { userId },
  });
  const { data } = result as { data: { getUserProfile: unknown } };
  if (!data.getUserProfile) return null;
  return UserSchema.parse(data.getUserProfile);
}
