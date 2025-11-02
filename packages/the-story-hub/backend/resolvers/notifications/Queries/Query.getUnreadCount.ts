import { util, Context } from "@aws-appsync/utils";

type CTX = Context<{ userId: string }>;

export function request(ctx: CTX) {
  const { userId } = ctx.arguments;

  console.log(`Counting unread notifications for user ${userId}`);

  return {
    operation: "Query",
    query: {
      expression: "PK = :pk AND begins_with(SK, :sk)",
      expressionValues: util.dynamodb.toMapValues({
        ":pk": `USER#${userId}`,
        ":sk": "NOTIFICATION#",
      }),
    },
    filter: {
      expression: "#read = :false",
      expressionNames: {
        "#read": "read",
      },
      expressionValues: util.dynamodb.toMapValues({
        ":false": false,
      }),
    },
  };
}

export function response(ctx: CTX): number {
  if (ctx.error) {
    console.error("Error counting unread notifications:", ctx.error);
    return util.error(ctx.error.message, ctx.error.type);
  }

  const count = ctx.result.items.length;
  console.log(`User has ${count} unread notifications`);

  return count;
}
