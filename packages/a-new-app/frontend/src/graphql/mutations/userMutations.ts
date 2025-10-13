import { GraphQLResult, generateClient } from "aws-amplify/api";
import {
  ANAUserInput,
  CreateANAUserMutation,
  CreateANAUserMutationVariables,
} from "../../types/gqlTypes";

const amplifyGraphqlClient = generateClient();

export const CREATE_ANA_USER = /* GraphQL */ `
  mutation CreateANAUser(
    $input: ANAUserInput! # Changed from CreateANAUserInput
  ) {
    createANAUser(input: $input) {
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

export const createANAUserMutationFn = async (input: ANAUserInput) => {
  try {
    const result = (await amplifyGraphqlClient.graphql<CreateANAUserMutation>({
      query: CREATE_ANA_USER,
      variables: { input } as CreateANAUserMutationVariables,
      authMode: "userPool",
    })) as GraphQLResult<CreateANAUserMutation>;

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
