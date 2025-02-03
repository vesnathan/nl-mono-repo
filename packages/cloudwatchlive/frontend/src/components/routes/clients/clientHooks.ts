import {
  saveEventCompanyAdminClientMutationFn,
  saveSuperAdminClientMutationFn,
  userQueryKeys,
} from "@/graphql/queries/userQueries";
import { useGraphqlMutation } from "@/hooks/useGraphQlMutation";
import {
  CWLClient,
  Client_CWLSuperAdminClient,
  EventCompanyClient,
} from "shared/types/CWLClientSchemas";

export const useSaveSuperAdminClientMutation = (options?: {
  onSuccess?: () => void;
  getSuccessMessage?: () => string;
  invalidate?: boolean;
  additionalInvalidationKeys?: string[];
}) => {
  const {
    onSuccess,
    getSuccessMessage,
    invalidate = true,
    additionalInvalidationKeys = [],
  } = options || {};

  return useGraphqlMutation({
    onSuccess,
    getSuccessMessage,
    invalidateKeys: invalidate
      ? [userQueryKeys.saveSuperAdminClient, ...additionalInvalidationKeys]
      : [],
    mutationFn: (input: CWLClient) => {
      if (input.clientType === "SuperAdmin") {
        // ✅ SuperAdmin Client Mutation
        const {
          orgName,
          clientType,
          addressLine1,
          addressLine2,
          city,
          state,
          country,
          postalCode,
          contactName,
          contactEmail,
          contactPhone,
          contactRole,
        } = input as Client_CWLSuperAdminClient;

        return saveSuperAdminClientMutationFn({
          orgName,
          clientType,
          addressLine1,
          addressLine2,
          city,
          state,
          country,
          postalCode,
          contactName,
          contactEmail,
          contactPhone,
          contactRole,
        });
      }
      throw new Error("Invalid clientType provided.");
    },
  });
};

export const useSaveEventCompanyAdimnClientMutation = (options?: {
  onSuccess?: () => void;
  getSuccessMessage?: () => string;
  invalidate?: boolean;
  additionalInvalidationKeys?: string[];
}) => {
  const {
    onSuccess,
    getSuccessMessage,
    invalidate = true,
    additionalInvalidationKeys = [],
  } = options || {};

  return useGraphqlMutation({
    onSuccess,
    getSuccessMessage,
    invalidateKeys: invalidate
      ? [userQueryKeys.saveSuperAdminClient, ...additionalInvalidationKeys]
      : [],
    mutationFn: (input: EventCompanyClient) => {
      const {
        orgName,
        clientType,
        addressLine1,
        addressLine2,
        city,
        state,
        country,
        postalCode,
        contactName,
        contactEmail,
        contactPhone,
        contactRole,
      } = input;

      return saveEventCompanyAdminClientMutationFn({
        orgName,
        clientType,
        addressLine1,
        addressLine2,
        city,
        state,
        country,
        postalCode,
        contactName,
        contactEmail,
        contactPhone,
        contactRole,
      });
    },
  });
};
