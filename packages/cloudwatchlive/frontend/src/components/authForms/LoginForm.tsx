import { LoginController } from "@/hooks/useLoginController";
import { Divider } from "@nextui-org/react";
import React from "react";
import { CWLButton } from "../common/CWLButton";
import { CWLTextField } from "../common/CWLTextField";

type Props = {
  loginController: LoginController;
  renderFooter?: () => React.ReactNode;
};

export const LoginForm: React.FC<Props> = ({
  loginController,
  renderFooter,
}) => {
  const {
    userEmail,
    setUserEmail,
    userPassword,
    setUserPassword,
    errorMessage,
    signInMutation,
    setActiveStep,
  } = loginController;

  const onForgetPassword = () => {
    setActiveStep("forgot-password-enter-email");
  };

  return (
    <div className="p-5">
      <h5 className="font-bold text-heading06 text-neutral-900">
        Welcome back!
      </h5>
      <p className="font-regular text-body2 mb-5 text-neutral-700">
        Please log in using your credentials
      </p>
      <CWLTextField
        label="Email address:"
        onChange={(e) => setUserEmail(e.target.value)}
      />
      <div className="mt-2">
        <CWLTextField
          label="Password"
          type="password"
          onChange={(e) => setUserPassword(e.target.value)}
        />
      </div>
      <div className="mt-2 text-error-500 text-body2">{errorMessage}</div>
      <div>
        <CWLButton
          buttonText="Log in"
          additionalClassName="h-[40px] w-full mt-4"
          isDisabled={
            !!(!userEmail || !userPassword || signInMutation.isPending)
          }
          onClick={(e) => {
            e.preventDefault();
            signInMutation.mutate({
              username: userEmail,
              password: userPassword,
            });
          }}
          color="primary"
        />
      </div>
      <div className="mt-4 mb-4">
        <div className="inline-block w-full text-center">
          <span
            data-testid="forgot-password-link"
            className="text-primary-500 text-body2 font-bold"
            onClick={onForgetPassword}
            tabIndex={0}
            role="button"
            onKeyDown={() => {}}
          >
            Forgot Your Password
          </span>
        </div>
      </div>

      {!!renderFooter && <Divider />}
      {renderFooter?.()}
    </div>
  );
};
