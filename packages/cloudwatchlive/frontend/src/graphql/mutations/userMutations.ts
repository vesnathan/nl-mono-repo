import { GraphQLResult, generateClient } from "aws-amplify/api";
import {
  CWLUserInput,
  CreateCWLUserMutation,
  CreateCWLUserMutationVariables,
} from "../../types/gqlTypes";

const amplifyGraphqlClient = generateClient();

export const CREATE_CWL_USER = /* GraphQL */ `
  mutation CreateCWLUser(
    $input: CWLUserInput! # Changed from CreateCWLUserInput
  ) {
    createCWLUser(input: $input) {
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

export const createCWLUserMutationFn = async (input: CWLUserInput) => {
  try {
    const result = (await amplifyGraphqlClient.graphql<CreateCWLUserMutation>({
      query: CREATE_CWL_USER,
      variables: { input } as CreateCWLUserMutationVariables,
      authMode: "userPool",
    })) as GraphQLResult<CreateCWLUserMutation>;

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
