import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { signIn, SignInInput } from "aws-amplify/auth";
import { useSetGlobalMessage } from "@/components/common/GlobalMessage";

export const useLoginController = (options: { onLoginSuccess: () => void }) => {
  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const setGlobalMessage = useSetGlobalMessage();

  const signInMutation = useMutation({
    mutationFn: async (input: SignInInput) => {
      setErrorMessage("");
      try {
        const result = await signIn(input);
        if (result.isSignedIn) {
          setGlobalMessage({
            color: "success",
            content: "Successfully logged in!",
          });
          options.onLoginSuccess();
        }
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Failed to login";
        setErrorMessage(message);
        setGlobalMessage({
          color: "error",
          content: message,
        });
        throw error;
      }
    },
  });

  return {
    userEmail,
    setUserEmail,
    userPassword,
    setUserPassword,
    errorMessage,
    signInMutation,
  };
};
