import type { AppSyncIdentityCognito } from "@aws-appsync/utils";
import { S3Client } from "@aws-sdk/client-s3";
import {
  createPresignedPost,
  PresignedPostOptions,
} from "@aws-sdk/s3-presigned-post";
import crypto from "node:crypto";
import { Mutation, MutationToGenerateS3UploadURLArgs } from "../gqlTypes";
import { FileTypes } from "./FileTypes";
import { getProcessEnv } from "../getProcessEnv";

type Output = Mutation["generateS3UploadURL"];
const s3Client = new S3Client();

export const handler = async (event: any): Promise<Output> => {
  const { input } = event.arguments as MutationToGenerateS3UploadURLArgs;
  const identity = event.identity as AppSyncIdentityCognito;

  const userId = identity.username;

  const validateInput = () => {
    const definedValues = Object.entries(input).filter(([key, value]) => {
      return !!value;
    });
    if (definedValues.length !== 1) {
      throw Error(
        `There should be exactly one defined field for file upload input`,
      );
    }
    return definedValues[0][0];
  };
  const definedInputFieldName = validateInput();

  const getFileExtension = (fileName: string): string => {
    return fileName.includes(".") ? `.${fileName.split(".").slice(-1)[0]}` : "";
  };

  const getPresignedPostOptions = (): PresignedPostOptions => {
    if (input.SMSFDeed) {
      const { fileName, contentType } = input.SMSFDeed;

      const fileExtension = getFileExtension(fileName);
      const key = `${userId}/SMSFDeeds/${crypto.randomUUID()}${fileExtension}`;

      return {
        Bucket: USER_FILES_BUCKET_NAME,
        Key: key,
        Fields: {
          // user-defined object metadata. Must start with x-amz-meta-
          // https://docs.aws.amazon.com/AmazonS3/latest/userguide/UsingMetadata.html#UserMetadata
          "x-amz-meta-userid": userId,
          "x-amz-meta-key": key,
          "x-amz-meta-file-type": FileTypes.CWLUserUploadedFile,
          "x-amz-meta-original-filename": fileName,
          "Content-Type": contentType,
        },
        Conditions: [
          // limit to 10MB maximum
          ["content-length-range", 0, 10000000],
          ["eq", "$x-amz-meta-userid", userId],
          ["eq", "$x-amz-meta-key", key],
          ["eq", "$x-amz-meta-file-type", FileTypes.CWLUserUploadedFile],
          ["eq", "$x-amz-meta-original-filename", fileName],
          ["eq", "$Content-Type", contentType],
        ],
      };
    }

    if (input.ProfilePicture) {
      const { fileName } = input.ProfilePicture;
      // no random id means that uploading a new picture will override old one
      const key = `${userId}/profilePicture`;
      return {
        Bucket: USER_FILES_BUCKET_NAME,
        Key: key,
        Fields: {
          "x-amz-meta-userid": userId,
          "x-amz-meta-key": key,
          "x-amz-meta-file-type": FileTypes.ProfilePicture,
          "x-amz-meta-original-filename": fileName,
        },
        Conditions: [
          // limit to 10MB maximum
          ["content-length-range", 0, 10000000],
          ["eq", "$x-amz-meta-userid", userId],
          ["eq", "$x-amz-meta-key", key],
          ["eq", "$x-amz-meta-file-type", FileTypes.ProfilePicture],
          ["eq", "$x-amz-meta-original-filename", fileName],
        ],
      };
    }

    if (input.Insurance) {
      const { fileName, contentType, insuranceKind } = input.Insurance;

      const fileExtension = getFileExtension(fileName);
      const key = `${userId}/Insurance/${insuranceKind}_${crypto.randomUUID()}${fileExtension}`;

      return {
        Bucket: USER_FILES_BUCKET_NAME,
        Key: `temp/${key}`,
        Fields: {
          // user-defined object matadata. Must starts with x-amz-meta-
          // https://docs.aws.amazon.com/AmazonS3/latest/userguide/UsingMetadata.html#UserMetadata
          "x-amz-meta-userid": userId,
          "x-amz-meta-key": key,
          "x-amz-meta-file-type": FileTypes.CWLUserUploadedFile,
          "x-amz-meta-insurance-kind": insuranceKind,
          "x-amz-meta-original-filename": fileName,
          "Content-Type": contentType,
        },
        Conditions: [
          // limit to 10MB maximum
          ["content-length-range", 0, 10000000],
          ["eq", "$x-amz-meta-userid", userId],
          ["eq", "$x-amz-meta-key", key],
          ["eq", "$x-amz-meta-file-type", FileTypes.CWLUserUploadedFile],
          ["eq", "$x-amz-meta-insurance-kind", insuranceKind],
          ["eq", "$x-amz-meta-original-filename", fileName],
          ["eq", "$Content-Type", contentType],
        ],
      };
    }

    if (input.estate) {
      const { fileName, contentType, estateDocumentType } = input.estate;

      const fileExtension = getFileExtension(fileName);
      const key = `${userId}/Estate/${estateDocumentType}/${crypto.randomUUID()}${fileExtension}`;

      return {
        Bucket: USER_FILES_BUCKET_NAME,
        Key: `temp/${key}`,
        Fields: {
          // user-defined object matadata. Must starts with x-amz-meta-
          // https://docs.aws.amazon.com/AmazonS3/latest/userguide/UsingMetadata.html#UserMetadata
          "x-amz-meta-userid": userId,
          "x-amz-meta-key": key,
          "x-amz-meta-file-type": FileTypes.CWLUserUploadedFile,
          "x-amz-meta-original-filename": fileName,
          "Content-Type": contentType,
        },
        Conditions: [
          // limit to 10MB maximum
          ["content-length-range", 0, 10000000],
          ["eq", "$x-amz-meta-userid", userId],
          ["eq", "$x-amz-meta-key", key],
          ["eq", "$x-amz-meta-file-type", FileTypes.CWLUserUploadedFile],
          ["eq", "$x-amz-meta-original-filename", fileName],
          ["eq", "$Content-Type", contentType],
        ],
      };
    }

    if (input.retirement) {
      const { fileName, contentType, retirementDocumentType } =
        input.retirement;

      const fileExtension = getFileExtension(fileName);
      const key = `${userId}/${retirementDocumentType}/${crypto.randomUUID()}${fileExtension}`;

      return {
        Bucket: USER_FILES_BUCKET_NAME,
        Key: `temp/${key}`,
        Fields: {
          // user-defined object matadata. Must starts with x-amz-meta-
          // https://docs.aws.amazon.com/AmazonS3/latest/userguide/UsingMetadata.html#UserMetadata
          "x-amz-meta-userid": userId,
          "x-amz-meta-key": key,
          "x-amz-meta-file-type": FileTypes.CWLUserUploadedFile,
          "x-amz-meta-original-filename": fileName,
          "Content-Type": contentType,
        },
        Conditions: [
          // limit to 10MB maximum
          ["content-length-range", 0, 10000000],
          ["eq", "$x-amz-meta-userid", userId],
          ["eq", "$x-amz-meta-key", key],
          ["eq", "$x-amz-meta-file-type", FileTypes.CWLUserUploadedFile],
          ["eq", "$x-amz-meta-original-filename", fileName],
        ],
      };
    }
    if (input.expenseTransactionStatement) {
      const { fileName, contentType, transactionId } =
        input.expenseTransactionStatement;
      const fileExtension = getFileExtension(fileName);
      const key = `${userId}/expense_transaction_statement/${transactionId}/${crypto.randomUUID()}${fileExtension}`;
      return {
        Bucket: USER_FILES_BUCKET_NAME,
        // file goes to temp folder first, then move to permanent folder after form is saved
        Key: `temp/${key}`,
        Fields: {
          // user-defined object matadata. Must starts with x-amz-meta-
          // https://docs.aws.amazon.com/AmazonS3/latest/userguide/UsingMetadata.html#UserMetadata
          "x-amz-meta-userid": userId,
          "x-amz-meta-key": key,
          "x-amz-meta-file-type": FileTypes.CWLUserUploadedFile,
          "x-amz-meta-original-filename": fileName,
          "Content-Type": contentType,
        },
        Conditions: [
          // limit to 5MB maximum
          ["content-length-range", 0, 5000000],
          ["eq", "$x-amz-meta-userid", userId],
          ["eq", "$x-amz-meta-key", key],
          ["eq", "$x-amz-meta-file-type", FileTypes.CWLUserUploadedFile],
          ["eq", "$x-amz-meta-original-filename", fileName],
        ],
      };
    }

    if (input.investment) {
      const { fileName, contentType, mainCat, subCat } = input.investment;
      const fileExtension = getFileExtension(fileName);
      const subCatSegment = subCat ? `/${subCat}` : "";
      const key = `${userId}/Investment/${mainCat}${subCatSegment}/${crypto.randomUUID()}${fileExtension}`;
      return {
        Bucket: USER_FILES_BUCKET_NAME,
        Key: `temp/${key}`,
        Fields: {
          // user-defined object matadata. Must starts with x-amz-meta-
          // https://docs.aws.amazon.com/AmazonS3/latest/userguide/UsingMetadata.html#UserMetadata
          "x-amz-meta-userid": userId,
          "x-amz-meta-key": key,
          "x-amz-meta-file-type": FileTypes.CWLUserUploadedFile,
          "x-amz-meta-original-filename": fileName,
          "Content-Type": contentType,
        },
        Conditions: [
          // limit to 10MB maximum
          ["content-length-range", 0, 10000000],
          ["eq", "$x-amz-meta-userid", userId],
          ["eq", "$x-amz-meta-key", key],
          ["eq", "$x-amz-meta-file-type", FileTypes.CWLUserUploadedFile],
          ["eq", "$x-amz-meta-original-filename", fileName],
        ],
      };
    }

    if (input.cwlReportForEmail) {
      const { fileName, contentType } = input.cwlReportForEmail;
      const fileExtension = getFileExtension(fileName);
      const key = `${userId}/cwl_report_for_email/${crypto.randomUUID()}${fileExtension}`;
      return {
        Bucket: USER_FILES_BUCKET_NAME,
        Key: `temp/${key}`,
        Fields: {
          // user-defined object matadata. Must starts with x-amz-meta-
          // https://docs.aws.amazon.com/AmazonS3/latest/userguide/UsingMetadata.html#UserMetadata
          "x-amz-meta-userid": userId,
          "x-amz-meta-key": key,
          "x-amz-meta-file-type": FileTypes.CWLUserUploadedFile,
          "x-amz-meta-original-filename": fileName,
          "Content-Type": contentType,
        },
        Conditions: [
          // limit to 10MB maximum
          ["content-length-range", 0, 10000000],
          ["eq", "$x-amz-meta-userid", userId],
          ["eq", "$x-amz-meta-key", key],
          ["eq", "$x-amz-meta-file-type", FileTypes.CWLUserUploadedFile],
          ["eq", "$x-amz-meta-original-filename", fileName],
        ],
      };
    }

    throw Error(`Unimplemented file upload for ${definedInputFieldName}`);
  };

  const { USER_FILES_BUCKET_NAME } = getProcessEnv();
  const uploadOptions = getPresignedPostOptions();
  const data = await createPresignedPost(s3Client, uploadOptions);

  return {
    url: data.url,
    fileLocation: {
      Bucket: uploadOptions.Bucket,
      Key: uploadOptions.Key,
    },
    fields: data.fields,
  };
};
