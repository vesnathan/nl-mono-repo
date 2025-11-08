import { util } from "@aws-appsync/utils";
import type { Context } from "@aws-appsync/utils";

export function request(ctx: Context) {
  const { username } = ctx.arguments;

  return {
    operation: "Query",
    index: "GSI2",
    query: {
      expression: "GSI2PK = :usernamePK",
      expressionValues: {
        ":usernamePK": util.dynamodb.toDynamoDB(`USERNAME#${username}`),
      },
    },
    limit: 1,
  };
}

export function response(ctx: Context) {
  const { username } = ctx.arguments;
  const { error, result } = ctx;

  if (error) {
    return util.error(error.message, error.type);
  }

  // If we found any items, username is taken
  const available = result.items.length === 0;

  return {
    available,
    username,
  };
}
