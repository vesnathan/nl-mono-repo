import { to } from "await-to-js";
import { updatePassword as amplifyUpdatePassword } from "aws-amplify/auth";

type UpdatePasswordInput = {
  oldPassword: string;
  newPassword: string;
  onSuccess: () => void;
  onCodeSent: () => void;
  onResetLimitExceeded: () => void;
  onUserNotFound: () => void;
  onUnhandledError: (error: Error) => void;
  wrongOldPassword: () => void;
};

export const AuthUpdatePassword = async (input: UpdatePasswordInput) => {
  const [updatePasswordError] = await to(
    amplifyUpdatePassword({
      oldPassword: input.oldPassword,
      newPassword: input.newPassword,
    }),
  );
  if (updatePasswordError) {
    if (updatePasswordError.name === "LimitExceededException") {
      input.onResetLimitExceeded();
    } else if (updatePasswordError.name === "UserNotFoundException") {
      input.onUserNotFound();
    } else if (updatePasswordError.name === "NotAuthorizedException") {
      input.wrongOldPassword();
    } else {
      input.onUnhandledError(
        new Error(`204.147 updatePassword error`, {
          cause: updatePasswordError,
        }),
      );
    }
  } else {
    input.onSuccess();
  }
};
