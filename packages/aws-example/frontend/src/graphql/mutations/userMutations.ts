import { GraphQLResult, generateClient } from "aws-amplify/api";
import {
  AWSEUserInput,
  CreateAWSEUserMutation,
  CreateAWSEUserMutationVariables,
} from "@/types/gqlTypes";

const amplifyGraphqlClient = generateClient();

export const CREATE_AWSE_USER = /* GraphQL */ `
  mutation CreateAWSEUser(
    $input: AWSEUserInput! # Changed from CreateAWSEUserInput
  ) {
    createAWSEUser(input: $input) {
      # Removed condition argument
      userId
      userAddedById
      privacyPolicy
      termsAndConditions
      userFirstName
      userLastName
      userEmail
      userPhone
      userTitle
      userCreated
    }
  }
`;

export const createAWSEUserMutationFn = async (input: AWSEUserInput) => {
  try {
    const result = (await amplifyGraphqlClient.graphql<CreateAWSEUserMutation>({
      query: CREATE_AWSE_USER,
      variables: { input } as CreateAWSEUserMutationVariables,
      authMode: "userPool",
    })) as GraphQLResult<CreateAWSEUserMutation>;

    // Check for GraphQL errors
    if (result.errors && result.errors.length > 0) {
      throw new Error(result.errors[0].message || "GraphQL mutation failed");
    }

    return result;
  } catch (error) {
    console.error("GraphQL mutation error:", error);
    throw error;
  }
};
