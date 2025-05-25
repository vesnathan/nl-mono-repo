import React from "react";
import { Divider } from "@nextui-org/react";
import { LoginController } from "@/hooks/useLoginController";
import { useEnterKeySubmit } from "@/hooks/useEnterKeySubmit";
import { cwlAuthValidatePassword } from "shared/functions/cwlAuthValidatePassword";
import { CWLButton } from "../common/CWLButton";
import { CWLTextField } from "../common/CWLTextField";
import PasswordHelper from "../common/PasswordHelper";

type Props = {
  loginController: LoginController;
  onSubmit: (newValidPassword: string) => void;
  isLoading: boolean;
};

export const NewPasswordForm: React.FC<Props> = ({
  loginController,
  onSubmit,
  isLoading,
}) => {
  const { errorMessage, setErrorMessage } = loginController;
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmNewPassword, setConfirmNewPassword] = React.useState("");

  const newPasswordValidateResult = React.useMemo(() => {
    return cwlAuthValidatePassword(newPassword);
  }, [newPassword]);
  const newPasswordValid = React.useMemo(() => {
    if (newPassword !== confirmNewPassword) {
      return false;
    }

    if (newPasswordValidateResult.length === 0) {
      return true;
    }
    return newPasswordValidateResult.every((item) => item.satisfied);
  }, [newPassword, confirmNewPassword, newPasswordValidateResult]);

  const buttonDisabled = !newPasswordValid || isLoading;

  const submitHandler = () => {
    if (newPassword !== confirmNewPassword) {
      setErrorMessage("Password does not match with confirm password");
      return;
    }
    if (!newPasswordValid) {
      setErrorMessage("Password not valid");
      return;
    }
    onSubmit(newPassword);
  };

  useEnterKeySubmit({
    onSubmit: submitHandler,
    isDisabled: buttonDisabled,
  });

  return (
    <>
      <div className="px-6 pb-6">
        <div className="my-4">
          <div className="text-neutral-900 text-heading06 font-bold text-left">
            Create a Password
          </div>
          <div className="text-neutral-700 text-body2 font-regular text-left">
            Please create a new password.
          </div>
        </div>

        <div className="flex flex-col justify-center ">
          <span className="text-neutral-800 font-semibold text-body2 mb-1">
            New Password
          </span>
          <CWLTextField
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter your new password"
            type="password"
          />
          <span className="text-neutral-800 font-semibold text-body2 mt-3 mb-1">
            Confirm Password
          </span>
          <CWLTextField
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            placeholder="Enter your password again"
            type="password"
          />
        </div>
        <PasswordHelper validateResult={newPasswordValidateResult} />

        <div className="mt-2 text-error-500 text-body2">{errorMessage}</div>
      </div>
      <Divider />
      <div className="flex flex-row justify-center w-full">
        <div className="w-full p-4">
          <CWLButton
            buttonText="Submit"
            additionalClassName="h-[40px] w-full"
            isDisabled={buttonDisabled}
            onClick={submitHandler}
          />
        </div>
      </div>
    </>
  );
};
