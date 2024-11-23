import React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSetGlobalMessage } from "@/components/common/GlobalMessage";


export const useLoginController = (options: {
  onLoginSuccess: () => void;
  captureUnknownError: (err: Error) => void;
}) => {
  type LoginStep =
    | "login-enter-credentials"
    | "login-enter-new-password"
    | "login-enter-TOTP-code"
    | "forgot-password-enter-email"
    | "forgot-password-enter-code"
    | "forgot-password-enter-new-password";
  const [activeStep, setActiveStep] = React.useState<LoginStep>(
    "login-enter-credentials",
  );

  const [errorMessage, setErrorMessage] = React.useState("");
  const setGlobalMessage = useSetGlobalMessage();

  React.useEffect(() => {
    // reset error message when changing step
    setErrorMessage("");
  }, [activeStep, setErrorMessage]);

  // state for login forms
  const [userEmail, setUserEmail] = React.useState("");
  const [userPassword, setUserPassword] = React.useState("");
  const [TOTPCode, setTOTPCode] = React.useState("");

  // state for reset pw forms
  const [forgetPWEmail, setForgetPWEmail] = React.useState("");
  const [forgetPWCode, setForgetPWCode] = React.useState("");
  const queryClient = useQueryClient();

  const signInMutation = useMutation({
    mutationFn: async (input: {
      username: string;
      password: string;
      onNewPasswordRequired?: () => void;
      onTOTPRequired?: () => void;
    }) => {
      // remove all query to ensure no stale data
      // in case user logout and then login to a different account
      queryClient.removeQueries({
        type: "all",
      });
      setErrorMessage("");
      await cwlAuthSignIn({
        username: input.username,
        password: input.password,
        onSuccess: options.onLoginSuccess,
        onNewPasswordRequired: () => {
          setActiveStep("login-enter-new-password");
          input.onNewPasswordRequired?.();
        },
        onTOTPRequired: () => {
          setActiveStep("login-enter-TOTP-code");
          input.onTOTPRequired?.();
        },
        onInvalidPassword: () =>
          setErrorMessage("Incorrect username or password"),
        onUserNotFound: () => setErrorMessage("Incorrect username or password"),
        onUnhandledError: (err) => {
          setErrorMessage(`An unknown error occurred. 101.203`);
          options.captureUnknownError(err);
        },
      });
    },
  });

  // challengeResponse could be either newPassword or TOTP code
  const confirmSignInMutation = useMutation({
    mutationFn: async (input: {
      challengeResponse: string;
      challengeType: "newpassword" | "TOTP";
    }) => {
      const { challengeResponse, challengeType } = input;
      setErrorMessage("");
      await cwlAuthConfirmSignIn({
        challengeResponse,
        onSuccess: options.onLoginSuccess,
        onNewPasswordRequired: () => setActiveStep("login-enter-new-password"),
        onTOTPRequired: () => setActiveStep("login-enter-TOTP-code"),
        onCodeMismatch: () => setErrorMessage("Invalid code entered"),
        onEmptyChallenge: () =>
          setErrorMessage(
            challengeType === "newpassword"
              ? "Please enter new password"
              : "Please enter a code",
          ),
        onUnauthorized: () =>
          setErrorMessage("Session expired, refresh page to try again."),
        onUnhandledError: (err) => {
          setErrorMessage(`An unknown error occurred. 101.204`);
          options.captureUnknownError(err);
        },
      });
    },
  });

  const sendResetPasswordRequestMutation = useMutation({
    mutationFn: async (input: {
      username: string;
      onSuccess: () => void;
      onUserNotFound: () => void;
      onCodeSent: () => void;
    }) => {
      setErrorMessage("");
      await cwlAuthResetPassword({
        username: input.username,
        onSuccess: input.onSuccess,
        onCodeSent: input.onCodeSent,
        onUserNotFound: input.onUserNotFound,
        onUnhandledError: (error) => {
          setErrorMessage("We were unable to reset your password");
          options.captureUnknownError(error);
        },
        onResetLimitExceeded: () => {
          setErrorMessage(
            "You have exceeded the number of attempts to reset your password. Please try again later.",
          );
        },
      });
    },
  });

  const confirmResetPasswordMutation = useMutation({
    mutationFn: async (input: {
      username: string;
      confirmationCode: string;
      newPassword: string;
      onSuccess: () => void;
    }) => {
      setErrorMessage("");
      await cwlAuthConfirmResetPassword({
        username: input.username,
        confirmationCode: input.confirmationCode,
        newPassword: input.newPassword,
        onSuccess: () => {
          setGlobalMessage({
            color: "success",
            content: "Your password has been reset",
          });
          input.onSuccess();
        },
        onCodeExpired: () => setErrorMessage("Your code has been expired"),
        onInvalidCode: () => setErrorMessage("Invalid password reset code"),
        onUnhandledError: (err) => {
          setErrorMessage(`An unknown error occurred. 101.205`);
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
    userPassword,
    setUserPassword,

    forgetPWEmail,
    setForgetPWEmail,
    forgetPWCode,
    setForgetPWCode,

    TOTPCode,
    setTOTPCode,

    errorMessage,
    setErrorMessage,

    signInMutation,
    confirmSignInMutation,
    sendResetPasswordRequestMutation,
    confirmResetPasswordMutation,
  };
};

export type LoginController = ReturnType<typeof useLoginController>;
