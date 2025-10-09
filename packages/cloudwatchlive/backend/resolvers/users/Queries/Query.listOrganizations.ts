import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

const REGION = process.env.AWS_REGION || "ap-southeast-2";
const TABLE_NAME = process.env.TABLE_NAME || "nlmonorepo-cwl-datatable-dev";

const ddbClient = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(ddbClient);

export const handler = async () => {
  // Query GSI1PK = "ORGTYPE#EventCompany" to get all orgs
  const params = {
    TableName: TABLE_NAME,
    IndexName: "GSI1", // Assumes GSI1 is defined on GSI1PK/GSI1SK
    KeyConditionExpression: "GSI1PK = :orgtype",
    ExpressionAttributeValues: {
      ":orgtype": "ORGTYPE#EventCompany",
    },
  };

  const result = await docClient.send(new QueryCommand(params));
  // Return just the org fields
  return (
    result.Items?.map((item) => ({
      organizationId: item.organizationId,
      organizationName: item.organizationName,
      organizationType: item.organizationType,
      organizationCreated: item.organizationCreated,
      mainAdminUserId: item.mainAdminUserId,
      adminUserIds: item.adminUserIds,
      staffUserIds: item.staffUserIds,
    })) || []
  );
};
