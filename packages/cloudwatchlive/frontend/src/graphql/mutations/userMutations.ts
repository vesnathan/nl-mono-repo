import { GraphQLResult, generateClient } from "aws-amplify/api";
import { CWLUserInput, CreateCWLUserMutation, CreateCWLUserMutationVariables } from "../../types/gqlTypes";

const amplifyGraphqlClient = generateClient();

export const CREATE_CWL_USER = /* GraphQL */ `
  mutation CreateCWLUser(
    $input: CWLUserInput! # Changed from CreateCWLUserInput
  ) {
    createCWLUser(input: $input) { # Removed condition argument
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

export const createCWLUserMutationFn = (input: CWLUserInput) => {
  return amplifyGraphqlClient.graphql<CreateCWLUserMutation>({
    query: CREATE_CWL_USER,
    variables: { input } as CreateCWLUserMutationVariables,
    authMode: "userPool",
  }) as Promise<GraphQLResult<CreateCWLUserMutation>>;
};
