import { confirmSignIn as amplifyConfirmSignIn } from "aws-amplify/auth";
import to from "await-to-js";

type Input = {
  challengeResponse: string;
  // success
  onSuccess: () => void;
  // additional steps
  onTOTPRequired: () => void;
  onNewPasswordRequired: () => void;
  // error
  onEmptyChallenge: () => void;
  onCodeMismatch: () => void;
  onUnauthorized: () => void;
  onUnhandledError: (error: Error) => void;
};

export const authConfirmSignIn = async (input: Input) => {
  const [confirmSignInError, confirmSignInResult] = await to(
    amplifyConfirmSignIn({
      challengeResponse: input.challengeResponse,
    }),
  );
  if (confirmSignInError) {
    switch (confirmSignInError.name) {
      case "EmptyChallengeResponse":
        input.onEmptyChallenge();
        break;
      case "CodeMismatchException":
        input.onCodeMismatch();
        break;
      case "NotAuthorizedException":
        input.onUnauthorized();
        break;
      default:
        input.onUnhandledError(confirmSignInError);
        break;
    }
    return;
  }

  const nextStep = confirmSignInResult.nextStep.signInStep;
  switch (nextStep) {
    case "DONE": {
      input.onSuccess();
      break;
    }
    case "CONFIRM_SIGN_IN_WITH_TOTP_CODE": {
      input.onTOTPRequired();
      break;
    }
    case "CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED": {
      input.onNewPasswordRequired();
      break;
    }
    case "CONFIRM_SIGN_IN_WITH_CUSTOM_CHALLENGE":
    case "CONFIRM_SIGN_IN_WITH_SMS_CODE":
    case "CONFIRM_SIGN_UP":
    case "CONTINUE_SIGN_IN_WITH_MFA_SELECTION":
    case "CONTINUE_SIGN_IN_WITH_TOTP_SETUP":
    case "RESET_PASSWORD":
    default: {
      throw Error(`257.986 unhandled confirmSignIn nextStep: ${nextStep}`);
    }
  }
};
