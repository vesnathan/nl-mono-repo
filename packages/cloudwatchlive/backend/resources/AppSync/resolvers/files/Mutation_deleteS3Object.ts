import type { AppSyncIdentityCognito } from "@aws-appsync/utils";
import {
  HeadObjectCommand,
  S3Client,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { Mutation, MutationToDeleteS3ObjectArgs } from "../gqlTypes";

type Output = Mutation["deleteS3Object"];
const s3Client = new S3Client();

export const handler = async (event: any): Promise<Output> => {
  const { location } = event.arguments as MutationToDeleteS3ObjectArgs;
  const identity = event.identity as AppSyncIdentityCognito;

  const userId = identity.username;

  // validate if user can delete file via $x-amz-meta-userid tag
  const headObjResult = await s3Client.send(
    new HeadObjectCommand({
      Bucket: location.Bucket,
      Key: location.Key,
    }),
  );
  const userIdOfFile = headObjResult.Metadata?.userid ?? "";
  if (userIdOfFile !== userId) {
    throw Error(
      `Cannot delete file: user is not the original uploader`,
    );
  }

  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: location.Bucket,
      Key: location.Key,
    }),
  );
  return true;
};
