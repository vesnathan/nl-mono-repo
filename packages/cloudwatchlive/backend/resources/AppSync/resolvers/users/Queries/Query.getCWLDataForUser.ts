import { AttributeValue } from "@aws-sdk/client-dynamodb";
import { isAdminUserGroup } from "../../../../../../../shared/functions/cognitoUserGroup";
import { CWLDataItem, Query, QueryToGetCWLDataForUserArgs } from "../../gqlTypes";
import {
  util,
  runtime,
  Context,
  DynamoDBQueryRequest,
  DynamoDBExpression,
  AppSyncIdentityCognito,
} from "@aws-appsync/utils";

type CTX = Context<QueryToGetCWLDataForUserArgs>;
type DBItem = CWLDataItem;
type Output = Query["getCWLDataForUser"];

export function request(ctx: CTX) {
  const { userId } = ctx.args;
  if (!userId) {
    runtime.earlyReturn(undefined satisfies Output);
  }

  const identity = ctx.identity as AppSyncIdentityCognito;
  if (identity.username !== userId && !isAdminUserGroup(identity)) {
    return util.error(
      "User is not allowed to retrieve pfh data of a different user",
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
  return {
    operation: "Query",
    query: getQueryExpression(),
  } satisfies DynamoDBQueryRequest;
}

export function response(ctx: CTX): Output {
  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type);
  }

  const dbItems = ctx.result.items as DBItem[];
  const latestLastUpdate = dbItems
    .map((item) => item.lastUpdate)
    .sort()
    .reverse()[0];
  return {
    lastUpdate: latestLastUpdate,
    dataValues: dbItems.reduce<Record<string, string>>((acc, item) => {
      acc[item.fieldName] = item.fieldValue;
      return acc;
    }, {}),
  };
}
