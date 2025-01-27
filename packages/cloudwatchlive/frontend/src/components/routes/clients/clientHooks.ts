import {
  saveClientMutationFn,
  userQueryKeys,
} from "@/graphql/queries/userQueries";
import { useGraphqlMutation } from "@/hooks/useGraphQlMutation";
import { CWLClient } from "shared/types/CWLClient";

export const useSaveClientMutation = (options?: {
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
      ? [userQueryKeys.saveClient, ...additionalInvalidationKeys]
      : [],
    mutationFn: (input: CWLClient) => {
      const {
        id,
        orgName,
        createdDate,
        createdBy,
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
      return saveClientMutationFn({
        id,
        orgName,
        createdDate,
        createdBy,
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
