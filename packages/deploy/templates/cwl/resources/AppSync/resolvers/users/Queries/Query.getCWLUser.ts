import {
  util,
  runtime,
  Context,
  DynamoDBQueryRequest,
  DynamoDBExpression,
  AppSyncIdentityCognito,
} from "@aws-appsync/utils";
import {
  CWLUser,
  Query,
  QueryToGetCWLUserArgs,
} from "../../gqlTypes";
import type { AttributeValue } from "@aws-sdk/client-dynamodb";

type CTX = Context<QueryToGetCWLUserArgs>;
type DBItem = CWLUser;
type Output = Query["getCWLUser"];

export function request(ctx: CTX) {
  const { userId } = ctx.args;
  if (!userId) {
    runtime.earlyReturn(undefined satisfies Output);
  }

  const identity = ctx.identity as AppSyncIdentityCognito;
  if (identity.username !== userId) {
    return util.error(
      "User is not allowed to retrieve data of a different user",
      "Unauthorized",
    );
  }

  const getQueryExpression = (): DynamoDBExpression => {
    let expressionStr = `#userId = :userId`;
    const expressionNames: Record<string, keyof DBItem> = {
      "#userId": "userId",
    };
    const expressionValues: Record<string, AttributeValue> = {
      ":userId": util.dynamodb.toDynamoDB(userId),
    };

    return {
      expression: expressionStr,
      expressionNames,
      expressionValues,
    };
  };
  console.log("DynamoDB Query Expression", getQueryExpression());
  return {
    operation: "Query",
    query: getQueryExpression(),
  } satisfies DynamoDBQueryRequest;
}

export function response(ctx: CTX): Output {
  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type);
  }
  if (!ctx.result.items || ctx.result.items.length === 0) {
    return undefined;
  }
  return ctx.result.items[0] as DBItem;
}

