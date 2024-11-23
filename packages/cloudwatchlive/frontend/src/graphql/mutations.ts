/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "./gqlTypes";
type GeneratedMutation<InputType, OutputType> = string & {
  __generatedMutationInput: InputType;
  __generatedMutationOutput: OutputType;
};

export const associateSoftwareToken = /* GraphQL */ `mutation AssociateSoftwareToken($accessToken: String!) {
  associateSoftwareToken(accessToken: $accessToken) {
    secretCode
    __typename
  }
}
` as GeneratedMutation<
  APITypes.AssociateSoftwareTokenMutationVariables,
  APITypes.AssociateSoftwareTokenMutation
>;
export const verifySoftwareToken = /* GraphQL */ `mutation VerifySoftwareToken($input: VerifySoftwareTokenInput!) {
  verifySoftwareToken(input: $input) {
    status
    __typename
  }
}
` as GeneratedMutation<
  APITypes.VerifySoftwareTokenMutationVariables,
  APITypes.VerifySoftwareTokenMutation
>;
export const generateS3UploadURL = /* GraphQL */ `mutation GenerateS3UploadURL($input: GenerateS3UploadURLInput!) {
  generateS3UploadURL(input: $input) {
    url
    fileLocation {
      Bucket
      Key
      __typename
    }
    fields
    __typename
  }
}
` as GeneratedMutation<
  APITypes.GenerateS3UploadURLMutationVariables,
  APITypes.GenerateS3UploadURLMutation
>;
export const generateS3SignedURL = /* GraphQL */ `mutation GenerateS3SignedURL($bucketName: String!, $fileKey: String!) {
  generateS3SignedURL(bucketName: $bucketName, fileKey: $fileKey)
}
` as GeneratedMutation<
  APITypes.GenerateS3SignedURLMutationVariables,
  APITypes.GenerateS3SignedURLMutation
>;
export const deleteS3Object = /* GraphQL */ `mutation DeleteS3Object($location: S3FileLocationInput!) {
  deleteS3Object(location: $location)
}
` as GeneratedMutation<
  APITypes.DeleteS3ObjectMutationVariables,
  APITypes.DeleteS3ObjectMutation
>;
export const moveObjectToPermanentLocation = /* GraphQL */ `mutation MoveObjectToPermanentLocation($tempLocation: S3FileLocationInput!) {
  moveObjectToPermanentLocation(tempLocation: $tempLocation) {
    Bucket
    Key
    __typename
  }
}
` as GeneratedMutation<
  APITypes.MoveObjectToPermanentLocationMutationVariables,
  APITypes.MoveObjectToPermanentLocationMutation
>;
