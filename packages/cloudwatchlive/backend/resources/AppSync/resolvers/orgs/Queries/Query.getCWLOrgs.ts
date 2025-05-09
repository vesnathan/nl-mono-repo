import {
  util,
  runtime,
  Context,
  DynamoDBBatchGetItemRequest,
} from "@aws-appsync/utils";
import {
  CWLOrg,
  Query,
  QueryToGetCWLOrgsArgs,
} from "../../gqlTypes";
import type { AttributeValue } from "@aws-sdk/client-dynamodb";

type CTX = Context<QueryToGetCWLOrgsArgs>;
type DBItem = CWLOrg[];
type Output = Query["getCWLOrgs"];

export function request(ctx: CTX) {
  const { organizationIds } = ctx.args;
  const organizationIdsArray = JSON.parse(organizationIds);
  if (!organizationIdsArray || organizationIdsArray.length === 0) {
    runtime.earlyReturn([] satisfies Output);
  }

  const keys = organizationIdsArray.map((id: string) => ({
    organizationId: util.dynamodb.toDynamoDB(id),
  }));

  console.log("DynamoDB BatchGetItem Keys", keys);

  return {
    operation: "BatchGetItem",
    tables: {
      YourDynamoDBTableName: {
        keys,
      },
    },
  } satisfies DynamoDBBatchGetItemRequest;
}

export function response(ctx: CTX): Output {
  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type);
  }
  if (!ctx.result.data || !ctx.result.data.YourDynamoDBTableName) {
    return [];
  }

  return ctx.result.data.YourDynamoDBTableName as DBItem;
}
