import { GraphQLResult, generateClient } from "aws-amplify/api";
import {
  UserInput,
  CreateUserMutation,
  CreateUserMutationVariables,
} from "@/types/gqlTypes";

const amplifyGraphqlClient = generateClient();

export const CREATE_USER = /* GraphQL */ `
  mutation CreateUser($input: UserInput!) {
    createUser(input: $input) {
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

export const createUserMutationFn = async (input: UserInput) => {
  try {
    const result = (await amplifyGraphqlClient.graphql<CreateUserMutation>({
      query: CREATE_USER,
      variables: { input } as CreateUserMutationVariables,
      authMode: "userPool",
    })) as GraphQLResult<CreateUserMutation>;

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
