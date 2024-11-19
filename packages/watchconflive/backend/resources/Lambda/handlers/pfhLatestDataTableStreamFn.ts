import { getPfhLatestDataCollection } from "shared-aws-assets-backend/shared-functions/getFTAMongoDB";
import { syncDdbStreamEventToMongodb } from "shared-aws-assets-backend/shared-functions/syncDdbStreamEventToMongodb";
import type { DynamoDBStreamEvent } from "aws-lambda";
import { PfhLatestDataItem } from "../../AppSync/resolvers/gqlTypes";

export async function handler(event: DynamoDBStreamEvent) {
  const cwlLatestDataCollection = await getPfhLatestDataCollection();
  await syncDdbStreamEventToMongodb<PfhLatestDataItem>({
    event,
    collection: cwlLatestDataCollection,
    convertDDBTypeToMongoType: (ddbData) => ddbData,
    getFilter: (ddbData) => ({
      userId: ddbData.userId,
      fieldName: ddbData.fieldName,
    }),
  });
}
