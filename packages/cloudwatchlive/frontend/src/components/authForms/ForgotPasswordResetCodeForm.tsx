import { LoginController } from "@/hooks/useLoginController";
import { useEnterKeySubmit } from "@/hooks/useEnterKeySubmit";
import { Divider } from "@nextui-org/react";
import React from "react";
import { CWLButton } from "../common/CWLButton";
import { CWLTextField } from "../common/CWLTextField";

type Props = {
  loginController: LoginController;
};

export const ForgotPasswordResetCodeForm: React.FC<Props> = ({
  loginController,
}) => {
  const {
    forgetPWCode,
    setForgetPWCode,
    errorMessage,
    forgetPWEmail,
    setActiveStep,
  } = loginController;

  const backToEnterEmail = () => {
    setActiveStep("forgot-password-enter-email");
  };

  const submitHandler = () => {
    // NOTE: at this step, there's no backend check to validate whether the entered code is valid or not
    // The code validation will be handled when user enter new password
    setActiveStep("forgot-password-enter-new-password");
  };

  useEnterKeySubmit({
    onSubmit: submitHandler,
    isDisabled: !forgetPWCode,
  });

  return (
    <>
      <div className="px-6 pb-6">
        <div className="my-5">
          <div className="text-neutral-900 text-heading06 font-bold text-left">
            Reset Password Code
          </div>
          <div className="text-neutral-700 text-body2 font-regular text-left">
            Your six (6) digit reset password code has been sent to{" "}
            {forgetPWEmail}. Please enter the code below:
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <CWLTextField
            label="Reset Password Code"
            testId="reset-code-input"
            value={forgetPWCode}
            onClear={() => setForgetPWCode("")}
            onChange={(e) => setForgetPWCode(e.target.value)}
            placeholder="Enter six (6) digit code here"
          />

          <div className="text-error-500 text-body2">{errorMessage}</div>

          <CWLButton
            buttonText="Submit"
            additionalClassName="w-[140px] m-auto h-[40px]"
            onClick={submitHandler}
            isDisabled={!forgetPWCode}
          />
        </div>
      </div>
      <Divider />
      <CWLButton
        buttonText={
          <span className="text-neutral-700 text-body2 font-bold">
            Use another email address
          </span>
        }
        onClick={backToEnterEmail}
        additionalClassName="px-6 py-4 h-[56px]"
        color="transparent"
      />
    </>
  );
};
