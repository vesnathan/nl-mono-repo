import { util, Context, AppSyncIdentityCognito } from "@aws-appsync/utils";
import { Notification, CreateNotificationInput } from "gqlTypes";

type CTX = Context<{ input: CreateNotificationInput }>;

export function request(ctx: CTX) {
  const { input } = ctx.arguments;
  const notificationId = util.autoId();
  const now = util.time.nowISO8601();

  console.log(
    `Creating notification for user ${input.userId} of type ${input.type}`,
  );

  const item = {
    PK: `USER#${input.userId}`,
    SK: `NOTIFICATION#${notificationId}`,
    GSI1PK: `NOTIFICATION#${notificationId}`,
    GSI1SK: `USER#${input.userId}`,
    notificationId,
    userId: input.userId,
    type: input.type,
    message: input.message,
    read: false,
    relatedStoryId: input.relatedStoryId || null,
    relatedNodeId: input.relatedNodeId || null,
    relatedUserId: input.relatedUserId || null,
    createdAt: now,
  };

  return {
    operation: "PutItem",
    key: util.dynamodb.toMapValues({
      PK: item.PK,
      SK: item.SK,
    }),
    attributeValues: util.dynamodb.toMapValues(item),
  };
}

export function response(ctx: CTX): Notification {
  if (ctx.error) {
    console.error("Error creating notification:", ctx.error);
    return util.error(ctx.error.message, ctx.error.type);
  }

  console.log("Notification created successfully:", ctx.result);
  return ctx.result as Notification;
}
