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

export const authResetPassword = async (input: ResetPasswordInput) => {
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
      {
        const e = new Error("204.147 resetPassword error");
        // Assign cause in environments that support it; satisfy TS by using a cast
        (e as any).cause = resetPasswordError;
        input.onUnhandledError(e);
      }
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
      {
        const e = new Error(
          `204.148 unhandled resetPassword nextStep: ${nextStep}`,
        );
        (e as any).cause = resetPasswordError;
        input.onUnhandledError(e);
      }
      break;
    }
  }
};
