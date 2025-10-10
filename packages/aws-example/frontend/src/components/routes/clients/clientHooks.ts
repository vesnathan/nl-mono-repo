import { awsbUser } from "@/types/gqlTypes";

type MutationInput = Omit<
  awsbUser,
  "__typename" | "userId" | "privacyPolicy" | "termsAndConditions"
>;

export const useSaveSuperAdminClientMutation = (options?: {
  onSuccess?: () => void;
  getSuccessMessage?: () => string;
  invalidate?: boolean;
  additionalInvalidationKeys?: string[];
}) => {
  // TODO: Re-implement when mutation functions are available
  // For now, return a stub to avoid build errors
  return {
    mutate: (input: MutationInput) => {
      // Only log in development mode
      // eslint-disable-next-line no-console
      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.log("useSaveSuperAdminClientMutation called with:", input);
      }
      // Simulate success callback if provided
      if (options?.onSuccess) {
        setTimeout(options.onSuccess, 100);
      }
    },
    isPending: false,
    isSuccess: false,
    error: null,
  };
};
