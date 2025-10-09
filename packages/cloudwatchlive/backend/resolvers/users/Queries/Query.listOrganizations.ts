import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";

const REGION = process.env.AWS_REGION || "ap-southeast-2";
const TABLE_NAME = process.env.TABLE_NAME || "nlmonorepo-cwl-datatable-dev";

const ddbClient = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(ddbClient);

export const handler = async () => {
  try {
    // Scan for organization metadata items.
    // Organization metadata items use SK = `METADATA#<orgId>` and PK = `ORG#<orgId>`.
    // We paginate the scan to collect all matching items.
    const orgs: any[] = [];
    let ExclusiveStartKey: any = undefined;
    do {
      const params: any = {
        TableName: TABLE_NAME,
        // Only return items that look like org metadata
        FilterExpression: "begins_with(SK, :metaPrefix)",
        ExpressionAttributeValues: {
          ":metaPrefix": "METADATA#",
        },
        ProjectionExpression: "organizationId, organizationName, organizationType, organizationCreated, mainAdminUserId, adminUserIds, staffUserIds",
        ExclusiveStartKey,
      };

      const res = await docClient.send(new ScanCommand(params));
      if (res.Items && res.Items.length) {
        orgs.push(...res.Items);
      }
      ExclusiveStartKey = (res as any).LastEvaluatedKey;
    } while (ExclusiveStartKey);

    return (
      orgs.map((item) => ({
        organizationId: item.organizationId,
        organizationName: item.organizationName,
        organizationType: item.organizationType,
        organizationCreated: item.organizationCreated,
        mainAdminUserId: item.mainAdminUserId,
        adminUserIds: item.adminUserIds,
        staffUserIds: item.staffUserIds,
      })) || []
    );
  } catch (err) {
    // Log the error so deploy logs or CloudWatch contain the failure reason
    // and return an empty array so the GraphQL non-nullable list type is satisfied.
    // AppSync will otherwise return null for the field when the resolver throws.
    // eslint-disable-next-line no-console
    console.error("listOrganizations resolver error:", err);
    return [];
  }
};
