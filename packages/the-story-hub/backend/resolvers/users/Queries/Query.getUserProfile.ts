import { util, AppSyncIdentityCognito, Context } from "@aws-appsync/utils";
import {
  User,
  ClientType,
  PatreonTier,
  PatreonInfo,
  UserPrivacySettings,
  UserNotificationSettings,
  UserContentSettings,
  ProfileVisibility,
  NotificationFrequency,
  AgeRating,
} from "gqlTypes";

type CTX = Context<{ userId: string }, object, object, object, User>;

export function request(ctx: CTX) {
  const { userId } = ctx.args;

  if (!userId) {
    return util.error("User ID is required", "ValidationException");
  }

  console.log(`Getting user profile for userId: ${userId}`);

  return {
    operation: "GetItem",
    key: util.dynamodb.toMapValues({
      PK: `USER#${userId}`,
      SK: `PROFILE#${userId}`,
    }),
  };
}

export function response(ctx: CTX): User | null {
  if (ctx.error) {
    console.error("Error fetching user profile:", ctx.error);
    return util.error(ctx.error.message, ctx.error.type);
  }

  const item = ctx.result as any;

  if (!item) {
    return null;
  }

  const identity = ctx.identity as AppSyncIdentityCognito;

  // Map Cognito groups to ClientType
  const cognitoGroups = identity.groups || [];
  const clientType: ClientType[] = [];

  for (const group of cognitoGroups) {
    if (group === "SiteAdmin") {
      clientType.push(ClientType.SiteAdmin);
    } else if (group === "StoryContributor") {
      clientType.push(ClientType.StoryContributor);
    } else if (group === "Reader") {
      clientType.push(ClientType.Reader);
    }
  }

  if (clientType.length === 0) {
    clientType.push(ClientType.UnauthenticatedUser);
  }

  // Build PatreonInfo from DynamoDB item
  let patreonInfo: PatreonInfo | null = null;
  if (item.patreonTier) {
    patreonInfo = {
      __typename: "PatreonInfo",
      tier: item.patreonTier as PatreonTier,
      patreonUserId: item.patreonUserId || null,
      lastSynced: item.patreonLastSynced || null,
    };
  }

  // Build Privacy Settings with defaults
  const privacySettings: UserPrivacySettings = item.privacySettings || {
    __typename: "UserPrivacySettings",
    profileVisibility: ProfileVisibility.PUBLIC,
    showStats: true,
  };

  // Build Notification Settings with defaults
  const notificationSettings: UserNotificationSettings =
    item.notificationSettings || {
      __typename: "UserNotificationSettings",
      emailNotifications: true,
      notifyOnReply: true,
      notifyOnUpvote: true,
      notifyOnStoryUpdate: true,
      notificationFrequency: NotificationFrequency.IMMEDIATE,
    };

  // Build Content Settings with defaults
  const contentSettings: UserContentSettings = item.contentSettings || {
    __typename: "UserContentSettings",
    defaultAgeRatingFilter: AgeRating.M,
    hideAIContent: false,
    autoSaveEnabled: true,
  };

  const user: User = {
    __typename: "User",
    userId: item.userId || ctx.args.userId,
    username: item.username,
    email: item.email,
    bio: item.bio,
    stats: item.stats,
    patreonSupporter: item.patreonSupporter || false,
    patreonInfo,
    ogSupporter: item.ogSupporter || false,
    clientType,
    createdAt: item.createdAt,
    privacySettings,
    notificationSettings,
    contentSettings,
  };

  console.log("User profile fetched successfully");
  return user;
}
