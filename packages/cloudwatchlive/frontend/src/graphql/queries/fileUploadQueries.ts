// Duplicate of packages/personal-financial-health/frontend/src/graphql/mutations/fileMutations.ts
import { GraphQLResult, generateClient } from "aws-amplify/api";
import {
  deleteS3ObjectMutation,
  deleteS3ObjectMutationVariables,
  generateS3SignedURLMutation,
  generateS3SignedURLMutationVariables,
  generateS3UploadURLMutation,
  generateS3UploadURLMutationVariables,
} from "~graphql/gqlTypes";

const amplifyGqlClient = generateClient();

const generateS3UploadURLMutationStr = `
  mutation generateS3UploadURL($input: GenerateS3UploadURLInput!) {
    generateS3UploadURL(input: $input) {
      url
      fields
      fileLocation {
        Bucket
        Key
      }
    }
  }
`;

export const generateS3UploadURLMutationFn = (
  variables: generateS3UploadURLMutationVariables,
) => {
  return amplifyGqlClient.graphql({
    query: generateS3UploadURLMutationStr,
    variables,
    authMode: "userPool",
  }) as Promise<GraphQLResult<generateS3UploadURLMutation>>;
};

const generateS3SignedURLMutationStr = `
    mutation generateS3SignedURL($bucketName: String! $fileKey: String!) {
      generateS3SignedURL(bucketName: $bucketName, fileKey: $fileKey)
    }
`;

export const generateS3SignedURLMutationFn = (
  variables: generateS3SignedURLMutationVariables,
) => {
  return amplifyGqlClient.graphql({
    query: generateS3SignedURLMutationStr,
    variables,
    authMode: "userPool",
  }) as Promise<GraphQLResult<generateS3SignedURLMutation>>;
};

const deleteS3ObjectMutationStr = `
    mutation deleteS3Object($location: S3FileLocationInput!) {
      deleteS3Object(location: $location)
    }
`;

export const deleteS3ObjectMutationFn = (
  variables: deleteS3ObjectMutationVariables,
) => {
  return amplifyGqlClient.graphql({
    query: deleteS3ObjectMutationStr,
    variables,
    authMode: "userPool",
  }) as Promise<GraphQLResult<deleteS3ObjectMutation>>;
};
