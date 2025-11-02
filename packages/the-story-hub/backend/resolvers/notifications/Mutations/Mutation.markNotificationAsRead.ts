import { util, Context } from "@aws-appsync/utils";
import { Notification } from "gqlTypes";

type CTX = Context<{ notificationId: string }>;

/**
 * This is a simple resolver that requires the caller to know the userId.
 * For a more flexible implementation, use a pipeline resolver with GSI1 lookup.
 *
 * For now, we'll assume notifications are accessed via their composite key.
 * A better approach would be to pass both notificationId and userId from the client.
 */
export function request(ctx: CTX) {
  const { notificationId } = ctx.arguments;
  const identity = ctx.identity as any;
  const userId = identity.username;

  console.log(
    `Marking notification ${notificationId} as read for user ${userId}`,
  );

  return {
    operation: "UpdateItem",
    key: util.dynamodb.toMapValues({
      PK: `USER#${userId}`,
      SK: `NOTIFICATION#${notificationId}`,
    }),
    update: {
      expression: "SET #read = :true",
      expressionNames: {
        "#read": "read",
      },
      expressionValues: util.dynamodb.toMapValues({
        ":true": true,
      }),
    },
  };
}

export function response(ctx: CTX): Notification {
  if (ctx.error) {
    console.error("Error marking notification as read:", ctx.error);
    return util.error(ctx.error.message, ctx.error.type);
  }

  console.log("Notification marked as read successfully");
  return ctx.result as Notification;
}
