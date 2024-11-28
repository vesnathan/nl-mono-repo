import React from "react";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSetGlobalMessage } from "@/components/common/GlobalMessage";

/**
 * A wrapper hook around react-query useMutation to streamline error handling
 */

const graphqlErrorSchema = z.object({
  errors: z.array(
    z.object({
      message: z.string(),
      path: z.array(z.string()).default([]),
    }),
  ),
});
type GraphQLError = z.infer<typeof graphqlErrorSchema>;

type ErrorContext = {
  graphQLError: GraphQLError | null;
};

type UseGraphqlMutationOption<TData, TVariables> = {
  // if define, will call setGlobalMessage on success
  getSuccessMessage?: (data: TData) => React.ReactNode;
  // customize error message. If null is returned, will not call setGlobalMessage
  getErrorMessage?: (error: unknown, context: ErrorContext) => string | null;
  onError?: (error: unknown, context: ErrorContext) => void;

  onSuccess?: (data: TData, variables: TVariables) => void;
  onSettled?: () => void;

  mutationFn: (variables: TVariables) => Promise<TData>;
  invalidateKeys: string[];

  getSentryErrorTags?: () => Record<string, string>;
};

export function useGraphqlMutation<TData, TVariables>(
  options: UseGraphqlMutationOption<TData, TVariables>,
) {
  const setGlobalMessage = useSetGlobalMessage();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: options.mutationFn,
    onSuccess: (data, variables) => {
      Object.values(options.invalidateKeys).forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey: [queryKey] });
      });
      if (options.getSuccessMessage) {
        const successMessage = options.getSuccessMessage(data);
        setGlobalMessage({
          content: successMessage,
          color: "success",
        });
      }
      options.onSuccess?.(data, variables);
    },
    onSettled: options.onSettled,
    onError: (error, variables) => {

      const parseGraphQLError = (): GraphQLError | null => {
        const parseResult = graphqlErrorSchema.safeParse(error);
        if (parseResult.success) {
          return parseResult.data;
        }
        return null;
      };

      const errorContext: ErrorContext = {
        graphQLError: parseGraphQLError(),
      };

      let errorMessage = "An unexpected error has occured";
      if (options.getErrorMessage) {
        const customErrorMessage = options.getErrorMessage(error, errorContext);
        if (customErrorMessage === null) {
          // message already handled
          return;
        }
        errorMessage = customErrorMessage;
      }

      setGlobalMessage({
        content: errorMessage,
        color: "error",
      });

      options.onError?.(error, errorContext);
    },
  });
}
