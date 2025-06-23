import { CWLUser } from "@/types/gqlTypes";

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
  // TODO: Re-implement when mutation functions are available
  // For now, return a stub to avoid build errors
  return {
    mutate: (input: MutationInput) => {
      // Only log in development mode
      if (process.env.NODE_ENV === 'development') {
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
