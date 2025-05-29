import {
  util,
  runtime,
  Context,
  DynamoDBBatchGetItemRequest,
} from "@aws-appsync/utils";
import {
  CWLOrg,
} from "../../gqlTypes";
import type { AttributeValue } from "@aws-sdk/client-dynamodb";

// Note: getCWLOrgs query doesn't exist in the schema yet
interface GetCWLOrgsArgs {
  organizationIds: string;
}

type CTX = Context<GetCWLOrgsArgs>;
type DBItem = CWLOrg[];
type Output = CWLOrg[];

export function request(ctx: CTX) {
  const { organizationIds } = ctx.args;
  const organizationIdsArray = JSON.parse(organizationIds);
  if (!organizationIdsArray || organizationIdsArray.length === 0) {
    runtime.earlyReturn([] satisfies Output);
  }

  const keys = organizationIdsArray.map((id: string) => ({
    organizationId: util.dynamodb.toDynamoDB(id),
  }));

  console.log("DynamoDb BatchGetItem Keys", keys);

  return {
    operation: "BatchGetItem",
    tables: {
      YourDynamoDbTableName: {
        keys,
      },
    },
  } satisfies DynamoDBBatchGetItemRequest;
}

export function response(ctx: CTX): Output {
  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type);
  }
  if (!ctx.result.data || !ctx.result.data.YourDynamoDbTableName) {
    return [];
  }

  return ctx.result.data.YourDynamoDbTableName as DBItem;
}
