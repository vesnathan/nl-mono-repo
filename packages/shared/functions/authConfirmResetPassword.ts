import { confirmResetPassword as amplifyConfirmResetPassword } from "aws-amplify/auth";
import to from "await-to-js";

type ConfirmResetPasswordInput = {
  confirmationCode: string;
  username: string;
  newPassword: string;
  onSuccess: () => void;
  onInvalidCode: () => void;
  onCodeExpired: () => void;
  onLimitExceeded: () => void;
  onUnhandledError: (error: Error) => void;
};

export const authConfirmResetPassword = async (
  input: ConfirmResetPasswordInput,
) => {
  const [confirmResetPasswordError] = await to(
    amplifyConfirmResetPassword({
      confirmationCode: input.confirmationCode,
      newPassword: input.newPassword,
      username: input.username,
    }),
  );

  if (confirmResetPasswordError) {
    switch (confirmResetPasswordError.name) {
      case "CodeMismatchException":
        input.onInvalidCode();
        return;
      case "ExpiredCodeException":
        input.onCodeExpired();
        return;
      case "LimitExceededException":
        input.onLimitExceeded();
        return;
      default:
        input.onUnhandledError(confirmResetPasswordError);
        return;
    }
  }

  // amplifyConfirmResetPassword doesn't return anything upon successful
  input.onSuccess();
};
