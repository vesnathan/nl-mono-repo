import { CWLUser } from "@/graphql/gqlTypes";
import {
  saveSuperAdminClientMutationFn,
  userMutationKeys,
} from "@/graphql/mutations/userMutations";
import { useGraphqlMutation } from "@/hooks/useGraphQlMutation";

type MutationInput = Omit<
  CWLUser,
  "__typename" | "userId" | "privacyPolicy" | "termsAndConditions"
>;

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
    mutationFn: (input: MutationInput) => {
      const {
        userFirstName = "",
        userLastName = "",
        userEmail = "",
        userPhone = "",
        userRole = "",
        userTitle = "",
        organizationId = "",
      } = input;

      return saveSuperAdminClientMutationFn({
        input: {
          userLastName,
          userFirstName,
          userEmail,
          userPhone,
          userRole,
          userTitle,
          organizationId,
        },
      });
    },
  });
};
