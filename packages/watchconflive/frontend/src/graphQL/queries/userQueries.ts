import { GraphQLResult, generateClient } from "aws-amplify/api";
import { GetAuthorizedUserQuery, GetAuthorizedUserQueryVariables } from "@/graphql/gqlTypes";

const amplifyGraphqlClient = generateClient();

export const userQueryKeys = {
  getCWLUser: "getCWLUser",
  profilePicture: "profilePicture",
};

const getAuthorizedUserQueryStr = `
    query GetAuthorizedUser($userId: String!) {
      getAuthorizedUser(userId: $userId) {
        ...CWLUser
      }
    }
    fragment CWLUser on CWLUser {
      userId
      userTitle
      userEmail
      userFirstName
      userLastName
    }
`;

export const getAuthorizedUserQueryFn = (variables: GetAuthorizedUserQueryVariables) => {

    return amplifyGraphqlClient.graphql({
      query: getAuthorizedUserQueryStr,
      variables,
      authMode: "userPool",
    }) as Promise<GraphQLResult<GetAuthorizedUserQuery>>;
  
};

export const getAuthorizedUserQueryKey = (userId: string) => [
  userQueryKeys.getCWLUser,
  userId,
];
