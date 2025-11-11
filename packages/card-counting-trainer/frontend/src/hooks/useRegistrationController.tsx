import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  signUp,
  confirmSignUp,
  SignUpInput,
  ConfirmSignUpInput,
  signIn,
} from "aws-amplify/auth";
import { useSetGlobalMessage } from "@/components/common/GlobalMessage";

export enum REGISTRATION_STEP {
  ENTER_DETAILS = "enter-details",
  ENTER_CONFIRMATION_CODE = "enter-confirmation-code",
}

export const useRegistrationController = (options: {
  onRegistrationSuccess: () => void;
  captureUnknownError?: (err: Error) => void;
}) => {
  const [activeStep, setActiveStep] = useState<REGISTRATION_STEP>(
    REGISTRATION_STEP.ENTER_DETAILS,
  );
  const [userEmail, setUserEmail] = useState("");
  const [username, setUsername] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmationCode, setConfirmationCode] = useState("");
  const [confirmationDestination, setConfirmationDestination] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const setGlobalMessage = useSetGlobalMessage();

  const signUpMutation = useMutation({
    mutationFn: async (input: SignUpInput) => {
      setErrorMessage("");
      try {
        const result = await signUp(input);
        if (result.nextStep.signUpStep === "CONFIRM_SIGN_UP") {
          setConfirmationDestination(
            result.nextStep.codeDeliveryDetails?.destination || userEmail,
          );
          setActiveStep(REGISTRATION_STEP.ENTER_CONFIRMATION_CODE);
          setGlobalMessage({
            color: "info",
            content: "Please check your email for confirmation code",
          });
        }
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Failed to sign up";
        setErrorMessage(message);
        setGlobalMessage({
          color: "error",
          content: message,
        });
        if (error instanceof Error) {
          options.captureUnknownError?.(error);
        }
        throw error;
      }
    },
  });

  const confirmSignUpMutation = useMutation({
    mutationFn: async (input: ConfirmSignUpInput & { password: string }) => {
      setErrorMessage("");
      try {
        await confirmSignUp({
          username: input.username,
          confirmationCode: input.confirmationCode,
        });

        // Auto login after confirmation
        await signIn({
          username: input.username,
          password: input.password,
        });

        setGlobalMessage({
          color: "success",
          content: "Account confirmed! Welcome!",
        });
        options.onRegistrationSuccess();
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Failed to confirm account";
        setErrorMessage(message);
        setGlobalMessage({
          color: "error",
          content: message,
        });
        if (error instanceof Error) {
          options.captureUnknownError?.(error);
        }
        throw error;
      }
    },
  });

  return {
    activeStep,
    userEmail,
    setUserEmail,
    username,
    setUsername,
    userPassword,
    setUserPassword,
    confirmPassword,
    setConfirmPassword,
    confirmationCode,
    setConfirmationCode,
    confirmationDestination,
    errorMessage,
    signUpMutation,
    confirmSignUpMutation,
  };
};
