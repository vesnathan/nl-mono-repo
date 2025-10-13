import { signIn as amplifySignIn } from "aws-amplify/auth";
import to from "await-to-js";
import { authSignOut } from "./authSignOut";

type SignInInput = {
  username: string;
  password: string;
  // success
  onSuccess: () => void;
  // additional steps
  onNewPasswordRequired: () => void;
  onTOTPRequired: () => void;
  // error
  onUserNotFound: () => void;
  onInvalidPassword: () => void;
  onUnhandledError: (error: Error) => void;
};

export const authSignIn = async (input: SignInInput) => {
  await authSignOut();
  const [signInError, signInResult] = await to(
    amplifySignIn({
      username: input.username,
      password: input.password,
    }),
  );
  if (signInError) {
    if (signInError.name === "UserNotFoundException") {
      input.onUserNotFound();
    } else if (signInError.name === "NotAuthorizedException") {
      input.onInvalidPassword();
    } else {
      {
        const e = new Error("257.141 signIn error");
        (e as any).cause = signInError;
        input.onUnhandledError(e);
      }
    }
    return;
  }

  const nextStep = signInResult.nextStep.signInStep;
  switch (nextStep) {
    case "DONE": {
      input.onSuccess();
      break;
    }
    case "CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED": {
      input.onNewPasswordRequired();
      break;
    }
    case "CONFIRM_SIGN_IN_WITH_TOTP_CODE": {
      input.onTOTPRequired();
      break;
    }
    case "CONFIRM_SIGN_IN_WITH_CUSTOM_CHALLENGE":
    case "CONFIRM_SIGN_IN_WITH_SMS_CODE":
    case "CONFIRM_SIGN_UP":
    case "CONTINUE_SIGN_IN_WITH_MFA_SELECTION":
    case "CONTINUE_SIGN_IN_WITH_TOTP_SETUP":
    case "RESET_PASSWORD":
    default: {
      input.onUnhandledError(
        new Error(`257.142 unhandled signIn nextStep: ${nextStep}`),
      );
    }
  }
};
