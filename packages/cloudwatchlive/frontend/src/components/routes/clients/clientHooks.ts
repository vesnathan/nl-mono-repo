import {
  saveEventCompanyAdminClientMutationFn,
  saveSuperAdminClientMutationFn,
  userMutationKeys,
} from "@/graphql/mutations/userMutations";
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
      ? [userMutationKeys.saveSuperAdminClient, ...additionalInvalidationKeys]
      : [],
    mutationFn: (input: CWLClient) => {
      if (input.clientType === "SuperAdmin") {
        // ✅ SuperAdmin Client Mutation
        const {
          orgId,
          orgName,
          clientType,
          addressLine1,
          addressLine2,
          city,
          state,
          country,
          postalCode,
          contactId,
          contactName,
          contactEmail,
          contactPhone,
          contactRole,
          sendConfirmationEmail,
        } = input as Client_CWLSuperAdminClient;

        return saveSuperAdminClientMutationFn({
          input: {
            orgId,
            orgName,
            clientType,
            addressLine1,
            addressLine2,
            city,
            state,
            country,
            postalCode,
            contactId,
            contactName,
            contactEmail,
            contactPhone,
            contactRole,
            sendConfirmationEmail,
          },
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
      ? [userMutationKeys.saveSuperAdminClient, ...additionalInvalidationKeys]
      : [],
    mutationFn: (input: EventCompanyClient) => {
      const {
        orgId,
        orgName,
        clientType,
        addressLine1,
        addressLine2,
        city,
        state,
        country,
        postalCode,
        contactId,
        contactName,
        contactEmail,
        contactPhone,
        contactRole,
        sendConfirmationEmail,
      } = input;

      return saveEventCompanyAdminClientMutationFn({
        orgId,
        orgName,
        clientType,
        addressLine1,
        addressLine2,
        city,
        state,
        country,
        postalCode,
        contactId,
        contactName,
        contactEmail,
        contactPhone,
        contactRole,
        sendConfirmationEmail,
      });
    },
  });
};
