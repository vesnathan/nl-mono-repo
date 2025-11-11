import React from "react";
import { useMutation } from "@tanstack/react-query";
import { authSignUp, authConfirmSignUp } from "shared/functions/authSignUp";
import { authSignIn } from "shared/functions/authSignIn";
import { checkUsernameAvailability } from "@/lib/api/users";

export type RegistrationStep =
  | "register-enter-details"
  | "register-enter-confirmation-code";

export const REGISTRATION_STEP = {
  ENTER_DETAILS: "register-enter-details" as const,
  ENTER_CONFIRMATION_CODE: "register-enter-confirmation-code" as const,
};

export const useRegistrationController = (options: {
  onRegistrationSuccess: () => void;
  captureUnknownError: (err: Error) => void;
}) => {
  const [activeStep, setActiveStep] = React.useState<RegistrationStep>(
    REGISTRATION_STEP.ENTER_DETAILS,
  );

  const [errorMessage, setErrorMessage] = React.useState("");

  React.useEffect(() => {
    // reset error message when changing step
    setErrorMessage("");
  }, [activeStep, setErrorMessage]);

  // state for registration forms
  const [userEmail, setUserEmail] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [usernameError, setUsernameError] = React.useState("");
  const [isCheckingUsername, setIsCheckingUsername] = React.useState(false);
  const [userPassword, setUserPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [confirmationCode, setConfirmationCode] = React.useState("");
  const [confirmationDestination, setConfirmationDestination] =
    React.useState("");

  // Debounced username validation
  React.useEffect(() => {
    if (!username || username.length < 3) {
      setUsernameError("");
      return undefined;
    }

    setIsCheckingUsername(true);
    const timeoutId = setTimeout(async () => {
      try {
        const result = await checkUsernameAvailability(username);
        if (!result.available) {
          setUsernameError("Username is already taken");
        } else {
          setUsernameError("");
        }
      } catch (error) {
        console.error("Error checking username:", error);
      } finally {
        setIsCheckingUsername(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [username]);

  const signUpMutation = useMutation({
    mutationFn: async (input: {
      username: string;
      email: string;
      password: string;
    }) => {
      setErrorMessage("");
      await authSignUp({
        username: input.username,
        password: input.password,
        email: input.email,
        onSuccess: () => {
          // Auto-sign in after successful registration
          options.onRegistrationSuccess();
        },
        onConfirmationRequired: (destination) => {
          setConfirmationDestination(destination);
          setActiveStep(REGISTRATION_STEP.ENTER_CONFIRMATION_CODE);
        },
        onUsernameExists: () =>
          setErrorMessage("An account with this email already exists"),
        onInvalidPassword: () =>
          setErrorMessage(
            "Password must be at least 8 characters and contain uppercase, lowercase, numbers, and special characters",
          ),
        onInvalidEmail: () =>
          setErrorMessage("Please enter a valid email address"),
        onUnhandledError: (err) => {
          setErrorMessage(`An unknown error occurred. 201.101`);
          options.captureUnknownError(err);
        },
      });
    },
  });

  const confirmSignUpMutation = useMutation({
    mutationFn: async (input: {
      username: string;
      confirmationCode: string;
      password: string;
    }) => {
      setErrorMessage("");
      await authConfirmSignUp({
        username: input.username,
        confirmationCode: input.confirmationCode,
        onSuccess: async () => {
          // After confirming, automatically sign in
          await authSignIn({
            username: input.username,
            password: input.password,
            onSuccess: options.onRegistrationSuccess,
            onNewPasswordRequired: () => {},
            onTOTPRequired: () => {},
            onUserNotFound: () =>
              setErrorMessage("Failed to sign in after confirmation"),
            onInvalidPassword: () =>
              setErrorMessage("Failed to sign in after confirmation"),
            onUnhandledError: (err) => {
              setErrorMessage(`An unknown error occurred. 201.102`);
              options.captureUnknownError(err);
            },
          });
        },
        onCodeMismatch: () => setErrorMessage("Invalid confirmation code"),
        onCodeExpired: () =>
          setErrorMessage(
            "Confirmation code has expired. Please request a new one.",
          ),
        onUnhandledError: (err) => {
          setErrorMessage(`An unknown error occurred. 201.103`);
          options.captureUnknownError(err);
        },
      });
    },
  });

  return {
    activeStep,
    setActiveStep,

    userEmail,
    setUserEmail,
    username,
    setUsername,
    usernameError,
    isCheckingUsername,
    userPassword,
    setUserPassword,
    confirmPassword,
    setConfirmPassword,
    confirmationCode,
    setConfirmationCode,
    confirmationDestination,

    errorMessage,
    setErrorMessage,

    signUpMutation,
    confirmSignUpMutation,
  };
};

export type RegistrationController = ReturnType<
  typeof useRegistrationController
>;
