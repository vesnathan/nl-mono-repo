import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { DynamoDB } from "@aws-sdk/client-dynamodb";

export const createDDBClient = () => {
  return DynamoDBDocument.from(new DynamoDB({ region: "ap-southeast-2" }));
};
