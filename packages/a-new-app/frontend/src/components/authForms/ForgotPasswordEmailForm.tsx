import { LoginController } from "@/hooks/useLoginController";
import { useEnterKeySubmit } from "@/hooks/useEnterKeySubmit";
import { Divider } from "@nextui-org/react";
import React from "react";
import { REGEX } from "@shared/constants/RegEx";
import { ANAButton } from "@/components/common/ANAButton";
import { ANATextField } from "@/components/common/ANATextField";

type Props = {
  loginController: LoginController;
};

export const ForgotPasswordEmailForm: React.FC<Props> = ({
  loginController,
}) => {
  const { forgetPWEmail, setForgetPWEmail, errorMessage, setActiveStep } =
    loginController;
  const emailValid = React.useMemo(() => {
    return REGEX.EMAIL.test(forgetPWEmail);
  }, [forgetPWEmail]);

  const isSubmitDisabled =
    !emailValid || loginController.sendResetPasswordRequestMutation.isPending;

  const backToLogin = () => {
    setActiveStep("login-enter-credentials");
  };

  const submitHandler = () => {
    const goToEnterCode = () => setActiveStep("forgot-password-enter-code");
    loginController.sendResetPasswordRequestMutation.mutate({
      username: loginController.forgetPWEmail,
      onCodeSent: goToEnterCode,
      onSuccess: goToEnterCode,
      // still navigate to enter code step even when user not found
      onUserNotFound: goToEnterCode,
    });
  };

  useEnterKeySubmit({
    onSubmit: submitHandler,
    isDisabled: isSubmitDisabled,
  });

  return (
    <>
      <form
        className="px-6 pb-6"
        onSubmit={(e) => {
          e.preventDefault();
          submitHandler();
        }}
      >
        <div className="my-5">
          <div className="text-neutral-900 text-heading06 font-bold text-left">
            Forgot Password
          </div>
          <div className="text-neutral-700 text-body2 font-regular text-left">
            Please enter your email address to reset your password.
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <ANATextField
            label="Email Address"
            value={forgetPWEmail}
            onClear={() => setForgetPWEmail("")}
            onChange={(e) => setForgetPWEmail(e.target.value)}
            placeholder="Enter your email address"
          />

          <div className="text-error-500 text-body2">{errorMessage}</div>

          <ANAButton
            buttonText="Submit"
            additionalClassName="w-[140px] m-auto h-[40px]"
            isDisabled={isSubmitDisabled}
            onClick={submitHandler}
          />
        </div>
      </form>
      <Divider />
      <ANAButton
        buttonText={
          <span className="text-neutral-700 text-body2 font-bold">Login</span>
        }
        onClick={backToLogin}
        additionalClassName="px-6 py-4 h-[56px] text-neutral-700 text-body2 font-bold"
        color="transparent"
      />
    </>
  );
};
