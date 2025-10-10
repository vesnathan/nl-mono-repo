import { GraphQLResult, generateClient } from "aws-amplify/api";
import {
  awsbUserInput,
  CreateawsbUserMutation,
  CreateawsbUserMutationVariables,
} from "../../types/gqlTypes";

const amplifyGraphqlClient = generateClient();

export const CREATE_awsb_USER = /* GraphQL */ `
  mutation CreateawsbUser(
    $input: awsbUserInput! # Changed from CreateawsbUserInput
  ) {
    createawsbUser(input: $input) {
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
      organizationId
      userRole
    }
  }
`;

export const createawsbUserMutationFn = async (input: awsbUserInput) => {
  try {
    const result = (await amplifyGraphqlClient.graphql<CreateawsbUserMutation>({
      query: CREATE_awsb_USER,
      variables: { input } as CreateawsbUserMutationVariables,
      authMode: "userPool",
    })) as GraphQLResult<CreateawsbUserMutation>;

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
