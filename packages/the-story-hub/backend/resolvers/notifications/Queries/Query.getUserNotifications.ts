import { util, Context } from "@aws-appsync/utils";
import { NotificationConnection } from "gqlTypes";

type CTX = Context<{ userId: string; limit?: number; nextToken?: string }>;

export function request(ctx: CTX) {
  const { userId, limit = 20, nextToken } = ctx.arguments;

  console.log(`Fetching notifications for user ${userId}`);

  return {
    operation: "Query",
    query: {
      expression: "PK = :pk AND begins_with(SK, :sk)",
      expressionValues: util.dynamodb.toMapValues({
        ":pk": `USER#${userId}`,
        ":sk": "NOTIFICATION#",
      }),
    },
    limit,
    nextToken,
    scanIndexForward: false, // Most recent first
  };
}

export function response(ctx: CTX): NotificationConnection {
  if (ctx.error) {
    console.error("Error fetching user notifications:", ctx.error);
    return util.error(ctx.error.message, ctx.error.type);
  }

  console.log(`Found ${ctx.result.items.length} notifications`);

  return {
    __typename: "NotificationConnection",
    items: ctx.result.items,
    nextToken: ctx.result.nextToken,
  };
}
