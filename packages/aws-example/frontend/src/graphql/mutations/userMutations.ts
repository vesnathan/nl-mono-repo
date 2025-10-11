import { GraphQLResult, generateClient } from "aws-amplify/api";
import {
  AWSBUserInput,
  CreateAWSBUserMutation,
  CreateAWSBUserMutationVariables,
} from "../../types/gqlTypes";

const amplifyGraphqlClient = generateClient();

export const CREATE_AWSB_USER = /* GraphQL */ `
  mutation CreateAWSBUser(
    $input: AWSBUserInput! # Changed from CreateAWSBUserInput
  ) {
    createAWSBUser(input: $input) {
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

export const createAWSBUserMutationFn = async (input: AWSBUserInput) => {
  try {
    const result = (await amplifyGraphqlClient.graphql<CreateAWSBUserMutation>({
      query: CREATE_AWSB_USER,
      variables: { input } as CreateAWSBUserMutationVariables,
      authMode: "userPool",
    })) as GraphQLResult<CreateAWSBUserMutation>;

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
