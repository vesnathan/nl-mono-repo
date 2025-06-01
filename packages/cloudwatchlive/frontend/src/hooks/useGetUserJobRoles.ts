import {
  superAdminJobRoles,
  eventManagementCompanyJobRoles,
} from "@/constants/jobRoles";
import { ClientType } from "@/graphql/gqlTypes";

export const useGetUserJobRoles = (clientType: ClientType[]) => {
  return clientType.includes(ClientType.SuperAdmin)
    ? [...superAdminJobRoles, ...eventManagementCompanyJobRoles]
    : eventManagementCompanyJobRoles;
};
