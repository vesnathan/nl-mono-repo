import {
  signUp as amplifySignUp,
  confirmSignUp as amplifyConfirmSignUp,
} from "aws-amplify/auth";
import to from "await-to-js";

type SignUpInput = {
  username: string;
  password: string;
  email: string;
  // success
  onSuccess: () => void;
  // additional steps
  onConfirmationRequired: (destination: string) => void;
  // error
  onUsernameExists: () => void;
  onInvalidPassword: () => void;
  onInvalidEmail: () => void;
  onUnhandledError: (error: Error) => void;
};

export const authSignUp = async (input: SignUpInput) => {
  const [signUpError, signUpResult] = await to(
    amplifySignUp({
      username: input.username,
      password: input.password,
      options: {
        userAttributes: {
          email: input.email,
          name: input.username, // Pass username as 'name' attribute for Lambda
        },
      },
    }),
  );

  if (signUpError) {
    if (signUpError.name === "UsernameExistsException") {
      input.onUsernameExists();
    } else if (signUpError.name === "InvalidPasswordException") {
      input.onInvalidPassword();
    } else if (signUpError.name === "InvalidParameterException") {
      // Check if it's related to email format
      if (signUpError.message?.toLowerCase().includes("email")) {
        input.onInvalidEmail();
      } else {
        const e = new Error("257.241 signUp parameter error");
        (e as any).cause = signUpError;
        input.onUnhandledError(e);
      }
    } else {
      const e = new Error("257.242 signUp error");
      (e as any).cause = signUpError;
      input.onUnhandledError(e);
    }
    return;
  }

  const nextStep = signUpResult.nextStep.signUpStep;
  switch (nextStep) {
    case "DONE": {
      input.onSuccess();
      break;
    }
    case "CONFIRM_SIGN_UP": {
      const destination =
        signUpResult.nextStep.codeDeliveryDetails?.destination || input.email;
      input.onConfirmationRequired(destination);
      break;
    }
    case "COMPLETE_AUTO_SIGN_IN": {
      // Auto sign in is handled separately
      input.onSuccess();
      break;
    }
    default: {
      input.onUnhandledError(
        new Error(`257.243 unhandled signUp nextStep: ${nextStep}`),
      );
    }
  }
};

type ConfirmSignUpInput = {
  username: string;
  confirmationCode: string;
  // success
  onSuccess: () => void;
  // error
  onCodeMismatch: () => void;
  onCodeExpired: () => void;
  onUnhandledError: (error: Error) => void;
};

export const authConfirmSignUp = async (input: ConfirmSignUpInput) => {
  const [confirmError, confirmResult] = await to(
    amplifyConfirmSignUp({
      username: input.username,
      confirmationCode: input.confirmationCode,
    }),
  );

  if (confirmError) {
    if (confirmError.name === "CodeMismatchException") {
      input.onCodeMismatch();
    } else if (confirmError.name === "ExpiredCodeException") {
      input.onCodeExpired();
    } else {
      const e = new Error("257.244 confirmSignUp error");
      (e as any).cause = confirmError;
      input.onUnhandledError(e);
    }
    return;
  }

  if (confirmResult.isSignUpComplete) {
    input.onSuccess();
  } else {
    input.onUnhandledError(new Error("257.245 signUp confirmation incomplete"));
  }
};
