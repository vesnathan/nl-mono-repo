import { resetPassword as amplifyResetPassword } from "aws-amplify/auth";
import to from "await-to-js";

type ResetPasswordInput = {
  username: string;
  onSuccess: () => void;
  onCodeSent: () => void;
  onResetLimitExceeded: () => void;
  onUserNotFound: () => void;
  onUnhandledError: (error: Error) => void;
};

export const ftaAuthResetPassword = async (input: ResetPasswordInput) => {
  const [resetPasswordError, resetPasswordResult] = await to(
    amplifyResetPassword({
      username: input.username,
    }),
  );
  if (resetPasswordError) {
    if (resetPasswordError.name === "LimitExceededException") {
      input.onResetLimitExceeded();
    } else if (resetPasswordError.name === "UserNotFoundException") {
      input.onUserNotFound();
    } else {
      input.onUnhandledError(
        new Error(`204.147 resetPassword error`, {
          cause: resetPasswordError,
        }),
      );
    }
    return;
  }

  const nextStep = resetPasswordResult.nextStep.resetPasswordStep;
  switch (nextStep) {
    case "DONE": {
      input.onSuccess();
      break;
    }
    case "CONFIRM_RESET_PASSWORD_WITH_CODE": {
      input.onCodeSent();
      break;
    }
    default: {
      input.onUnhandledError(
        new Error(`204.148 unhandled resetPassword nextStep: ${nextStep}`, {
          cause: resetPasswordError,
        }),
      );
      break;
    }
  }
};
