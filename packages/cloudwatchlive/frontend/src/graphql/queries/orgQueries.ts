import { GraphQLResult, generateClient } from "aws-amplify/api";

export type Organization = {
  organizationId: string;
  organizationName: string;
  organizationType: string;
  organizationCreated: string;
  mainAdminUserId: string;
  adminUserIds: string[];
  staffUserIds: string[];
};

const amplifyGraphqlClient = generateClient();

export const orgQueryKeys = {
  listOrganizations: "listOrganizations",
};

const listOrganizationsQueryStr = `
  query ListOrganizations {
    listOrganizations {
      organizationId
      organizationName
      organizationType
      organizationCreated
      mainAdminUserId
      adminUserIds
      staffUserIds
    }
  }
`;

export const listOrganizationsQueryKey = () => [orgQueryKeys.listOrganizations];

export const listOrganizationsQueryFn = () => {
  return amplifyGraphqlClient.graphql({
    query: listOrganizationsQueryStr,
    authMode: "userPool",
  }) as Promise<GraphQLResult<{ listOrganizations: Organization[] }>>;
};
