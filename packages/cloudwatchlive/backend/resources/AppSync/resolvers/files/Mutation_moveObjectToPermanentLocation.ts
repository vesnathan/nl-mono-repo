import type { AppSyncIdentityCognito } from "@aws-appsync/utils";
import {
  GetObjectCommand,
  S3Client,
  CopyObjectCommand,
} from "@aws-sdk/client-s3";
import {
  Mutation,
  MutationToMoveObjectToPermanentLocationArgs,
} from "../gqlTypes";

type Output = Mutation["moveObjectToPermanentLocation"];
const s3Client = new S3Client();

export const handler = async (event: any): Promise<Output> => {
  const { tempLocation } =
    event.arguments as MutationToMoveObjectToPermanentLocationArgs;
  const identity = event.identity as AppSyncIdentityCognito;

  const userId = identity.username;

  // validate if user can see the file via $x-amz-meta-userid tag
  const getObjResult = await s3Client.send(
    new GetObjectCommand({
      Bucket: tempLocation.Bucket,
      Key: tempLocation.Key,
    }),
  );
  const userIdOfFile = getObjResult.Metadata?.userid ?? "";

  if (userIdOfFile !== userId) {
    throw new Error(
      "Unable to move file: requesting user is different than uploading user",
    );
  }

  const permanentKey = getObjResult.Metadata?.key ?? "";
  // for now, both permanent and temporary location are in the same bucket
  const permanentBucket = tempLocation.Bucket;

  if (!permanentKey) {
    return tempLocation;
  }

  // no need to move if they're both the same
  if (
    permanentKey === tempLocation.Key &&
    permanentBucket === tempLocation.Bucket
  ) {
    return tempLocation;
  }

  await s3Client.send(
    new CopyObjectCommand({
      CopySource: `${tempLocation.Bucket}/${tempLocation.Key}`,
      Bucket: permanentBucket,
      Key: permanentKey,
    }),
  );
  return {
    Bucket: permanentBucket,
    Key: permanentKey,
  };
};
