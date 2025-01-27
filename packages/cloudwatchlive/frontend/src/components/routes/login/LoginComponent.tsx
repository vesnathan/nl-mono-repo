import { DEFAULT_REDIRECT_PATH } from "@/constants/layout/navigation/navigation";
import { useRouter } from "next/navigation";
import React from "react";
import { useLoginController } from "@/hooks/useLoginController";
import { exhaustiveCheck } from "@/utils/typeUtils";
import { LoginForm } from "../../authForms/LoginForm";
import { NewPasswordForm } from "../../authForms/NewPasswordForm";
import { TOTPForm } from "../../authForms/TOTPForm";
import { ForgotPasswordEmailForm } from "../../authForms/ForgotPasswordEmailForm";
import { ForgotPasswordResetCodeForm } from "../../authForms/ForgotPasswordResetCodeForm";

const LoginComponent = () => {
  console.log("LoginComponent");
  const router = useRouter();
  const loginController = useLoginController({
    onLoginSuccess: () => {
      router.replace(DEFAULT_REDIRECT_PATH);
    },
    captureUnknownError: (err: unknown) => {
      console.error(err);
    },
  });
  const { activeStep, setActiveStep } = loginController;

  const renderForm = () => {
    switch (activeStep) {
      case "login-enter-credentials":
        return <LoginForm loginController={loginController} />;
      case "login-enter-TOTP-code":
        return <TOTPForm loginController={loginController} />;
      case "login-enter-new-password":
      case "forgot-password-enter-new-password":
        return (
          <NewPasswordForm
            loginController={loginController}
            isLoading={
              loginController.confirmSignInMutation.isPending ||
              loginController.confirmResetPasswordMutation.isPending
            }
            onSubmit={(newPassword) => {
              if (activeStep === "login-enter-new-password") {
                loginController.confirmSignInMutation.mutate({
                  challengeType: "newpassword",
                  challengeResponse: newPassword,
                });
              }
              if (activeStep === "forgot-password-enter-new-password") {
                loginController.confirmResetPasswordMutation.mutate({
                  username: loginController.forgetPWEmail,
                  confirmationCode: loginController.forgetPWCode,
                  newPassword,
                  onSuccess: () => {
                    setActiveStep("login-enter-credentials");
                  },
                });
              }
            }}
          />
        );
      case "forgot-password-enter-email":
        return <ForgotPasswordEmailForm loginController={loginController} />;
      case "forgot-password-enter-code":
        return (
          <ForgotPasswordResetCodeForm loginController={loginController} />
        );
      default: {
        exhaustiveCheck(activeStep, "LoginComponent.activeStep");
        return <div>Unhandled step: {activeStep}</div>;
      }
    }
  };

  return <>{renderForm()}</>;
};
export default LoginComponent;
