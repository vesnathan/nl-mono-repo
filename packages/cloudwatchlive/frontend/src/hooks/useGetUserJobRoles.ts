import {
  superAdminJobRoles,
  eventManagementCompanyJobRoles,
} from "@/constants/jobRoles";
import { ClientType } from "@/graphql/gqlTypes";

export const useGetUserJobRoles = (userGroups: ClientType[]) => {
  return userGroups.includes(ClientType.SuperAdmin)
    ? [...superAdminJobRoles, ...eventManagementCompanyJobRoles]
    : eventManagementCompanyJobRoles;
};
