import { FTAUser } from "./gqlTypes";
import { getFTAUserCollection } from "shared-aws-assets-backend/shared-functions/getFTAMongoDB";

export const getFTAUser = async (userId: string): Promise<FTAUser> => {
  const userCollection = await getFTAUserCollection();
  const userIdKey: keyof FTAUser = "userId";
  const dbUser = await userCollection.findOne({
    [userIdKey]: userId
  });
  if (!dbUser) {
    throw Error(`Unable to find user ${userId}`);
  }
  return dbUser;
};
