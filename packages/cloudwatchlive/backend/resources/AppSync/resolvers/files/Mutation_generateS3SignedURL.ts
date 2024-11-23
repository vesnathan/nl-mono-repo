import type { AppSyncIdentityCognito } from "@aws-appsync/utils";
import {
  HeadObjectCommand,
  GetObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Mutation, MutationToGenerateS3SignedURLArgs } from "../gqlTypes";
import { FileTypes } from "./FileTypes";

type Output = Mutation["generateS3SignedURL"];
const s3Client = new S3Client();

export const handler = async (event: any): Promise<Output> => {
  const { fileKey, bucketName } =
    event.arguments as MutationToGenerateS3SignedURLArgs;
  const identity = event.identity as AppSyncIdentityCognito;

  const userId = identity.username;

  // validate if user can see the file via $x-amz-meta-userid tag
  const headObjResult = await s3Client.send(
    new HeadObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
    }),
  );
  const userIdOfFile = headObjResult.Metadata?.userid ?? "";
  const isProfilePicture =
    headObjResult.Metadata?.["file-type"] === FileTypes.ProfilePicture;

  // allow public view for profile picture
  if (!isProfilePicture && userIdOfFile !== userId) {
    throw new Error("User is different than the uploading user");
  }

  const originalFileName = headObjResult.Metadata?.["original-filename"] ?? "";

  const signedURL = await getSignedUrl(
    s3Client,
    new GetObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
      ResponseContentDisposition: `inline; filename="${
        originalFileName || fileKey
      }"`,
      ResponseContentType: headObjResult.ContentType,
    }),
    { expiresIn: 3600 },
  );

  return signedURL;
};
