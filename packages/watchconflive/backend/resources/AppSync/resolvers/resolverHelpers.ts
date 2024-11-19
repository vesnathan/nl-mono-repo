import { Key, util } from "@aws-appsync/utils";
import type { PfhNotification } from "./gqlTypes";

export const toPfhNotificationKey = (args: {
  userId: string;
  timestamp: string;
}): Key => {
  const userIdKey: keyof PfhNotification = "userId";
  const timestampKey: keyof PfhNotification = "timestamp";
  return util.dynamodb.toMapValues({
    [userIdKey]: args.userId,
    [timestampKey]: args.timestamp,
  });
};
