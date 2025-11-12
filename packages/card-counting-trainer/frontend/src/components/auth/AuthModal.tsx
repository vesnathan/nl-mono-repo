"use client";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Tabs,
  Tab,
} from "@nextui-org/react";
import { useState } from "react";
import { useLoginController } from "@/hooks/useLoginController";
import {
  useRegistrationController,
  REGISTRATION_STEP,
} from "@/hooks/useRegistrationController";
import { EyeFilledIcon, EyeSlashFilledIcon } from "@/components/common/EyeSVGR";
import { signInWithRedirect } from "aws-amplify/auth";

// CSS class constants
const INPUT_TEXT_WHITE = "text-white placeholder:text-gray-500 !text-white";
const INPUT_TEXT_WHITE_AUTOFILL =
  "text-white placeholder:text-gray-500 !text-white [&:-webkit-autofill]:[-webkit-text-fill-color:white] [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_rgb(31,41,55)]";
const INPUT_WRAPPER_BG =
  "bg-gray-800 border-gray-700 group-data-[focus=true]:bg-gray-800 group-data-[focus=true]:border-gray-600 data-[hover=true]:bg-gray-800";
const LABEL_WHITE = "text-white group-data-[filled-within=true]:text-white";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "login" | "register";
  onAuthSuccess?: () => void;
}

export function AuthModal({
  isOpen,
  onClose,
  initialMode = "login",
  onAuthSuccess,
}: AuthModalProps) {
  const [selectedTab, setSelectedTab] = useState<string>(initialMode);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] =
    useState(false);

  const loginController = useLoginController({
    onLoginSuccess: () => {
      onClose();
      onAuthSuccess?.();
    },
  });

  const registrationController = useRegistrationController({
    onRegistrationSuccess: () => {
      onClose();
      onAuthSuccess?.();
    },
    captureUnknownError: (err: Error) => {
      console.error(err);
    },
  });

  const handleClose = () => {
    setSelectedTab(initialMode);
    onClose();
  };

  const togglePasswordVisibility = () =>
    setIsPasswordVisible(!isPasswordVisible);
  const toggleConfirmPasswordVisibility = () =>
    setIsConfirmPasswordVisible(!isConfirmPasswordVisible);

  // Google OAuth handler
  const handleGoogleSignIn = async () => {
    try {
      await signInWithRedirect({ provider: "Google" });
    } catch (error) {
      console.error("Google sign-in error:", error);
    }
  };

  // Login handlers
  const handleLogin = () => {
    loginController.signInMutation.mutate({
      username: loginController.userEmail,
      password: loginController.userPassword,
    });
  };

  const handleKeyDownLogin = (e: React.KeyboardEvent) => {
    if (
      e.key === "Enter" &&
      loginController.userEmail &&
      loginController.userPassword
    ) {
      e.preventDefault();
      handleLogin();
    }
  };

  // Registration handlers
  const handleRegister = () => {
    if (
      registrationController.userPassword !==
      registrationController.confirmPassword
    ) {
      return;
    }
    registrationController.signUpMutation.mutate({
      username: registrationController.userEmail,
      password: registrationController.userPassword,
      options: {
        userAttributes: {
          email: registrationController.userEmail,
          preferred_username: registrationController.username,
        },
      },
    });
  };

  const handleConfirmCode = () => {
    registrationController.confirmSignUpMutation.mutate({
      username: registrationController.userEmail,
      confirmationCode: registrationController.confirmationCode,
      password: registrationController.userPassword,
    });
  };

  const handleKeyDownRegister = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const isRegisterDisabled =
        !registrationController.userEmail ||
        !registrationController.username ||
        !registrationController.userPassword ||
        !registrationController.confirmPassword ||
        registrationController.userPassword !==
          registrationController.confirmPassword;

      if (
        registrationController.activeStep === REGISTRATION_STEP.ENTER_DETAILS &&
        !isRegisterDisabled
      ) {
        handleRegister();
      } else if (
        registrationController.activeStep ===
          REGISTRATION_STEP.ENTER_CONFIRMATION_CODE &&
        registrationController.confirmationCode
      ) {
        handleConfirmCode();
      }
    }
  };

  const isLoginDisabled =
    !loginController.userEmail || !loginController.userPassword;
  const isRegisterDisabled =
    !registrationController.userEmail ||
    !registrationController.username ||
    !registrationController.userPassword ||
    !registrationController.confirmPassword ||
    registrationController.userPassword !==
      registrationController.confirmPassword;

  const renderLoginForm = () => (
    <div className="space-y-4">
      <Input
        label="Email address"
        type="email"
        value={loginController.userEmail}
        onChange={(e) => loginController.setUserEmail(e.target.value)}
        onKeyDown={handleKeyDownLogin}
        classNames={{
          input: INPUT_TEXT_WHITE_AUTOFILL,
          inputWrapper: INPUT_WRAPPER_BG,
          label: LABEL_WHITE,
        }}
        isDisabled={loginController.signInMutation.isPending}
      />
      <Input
        label="Password"
        type={isPasswordVisible ? "text" : "password"}
        value={loginController.userPassword}
        onChange={(e) => loginController.setUserPassword(e.target.value)}
        onKeyDown={handleKeyDownLogin}
        classNames={{
          input: INPUT_TEXT_WHITE_AUTOFILL,
          inputWrapper: INPUT_WRAPPER_BG,
          label: LABEL_WHITE,
        }}
        isDisabled={loginController.signInMutation.isPending}
        endContent={
          <button
            type="button"
            className="focus:outline-none"
            type="button"
            onClick={togglePasswordVisibility}
          >
            {isPasswordVisible ? (
              <EyeFilledIcon className="text-xl text-gray-400 pointer-events-none" />
            ) : (
              <EyeSlashFilledIcon className="text-xl text-gray-400 pointer-events-none" />
            )}
          </button>
        }
      />
      {loginController.errorMessage && (
        <p className="text-red-500 text-sm">{loginController.errorMessage}</p>
      )}

      {/* Divider */}
      <div className="flex items-center gap-4 my-4">
        <div className="flex-1 h-px bg-gray-700" />
        <span className="text-gray-400 text-sm">or continue with</span>
        <div className="flex-1 h-px bg-gray-700" />
      </div>

      {/* Google Sign-In Button */}
      <Button
        className="w-full bg-white hover:bg-gray-100 text-gray-800 font-semibold border border-gray-300"
        onPress={handleGoogleSignIn}
        startContent={
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
        }
      >
        Sign in with Google
      </Button>
    </div>
  );

  const renderRegistrationForm = () => (
    <>
      <p className="text-gray-400 text-center mb-4">
        Join Backroom Blackjack and start mastering your skills
      </p>
      <div className="space-y-4">
        <Input
          label="Email address"
          type="email"
          value={registrationController.userEmail}
          onChange={(e) => registrationController.setUserEmail(e.target.value)}
          onKeyDown={handleKeyDownRegister}
          classNames={{
            input: INPUT_TEXT_WHITE_AUTOFILL,
            inputWrapper: INPUT_WRAPPER_BG,
            label: LABEL_WHITE,
          }}
          isDisabled={registrationController.signUpMutation.isPending}
        />
        <Input
          label="Username"
          type="text"
          value={registrationController.username}
          onChange={(e) => registrationController.setUsername(e.target.value)}
          onKeyDown={handleKeyDownRegister}
          classNames={{
            input: INPUT_TEXT_WHITE,
            inputWrapper: INPUT_WRAPPER_BG,
            label: LABEL_WHITE,
          }}
          isDisabled={registrationController.signUpMutation.isPending}
        />
        <Input
          label="Password"
          type={isPasswordVisible ? "text" : "password"}
          value={registrationController.userPassword}
          onChange={(e) =>
            registrationController.setUserPassword(e.target.value)
          }
          onKeyDown={handleKeyDownRegister}
          classNames={{
            input: INPUT_TEXT_WHITE_AUTOFILL,
            inputWrapper: INPUT_WRAPPER_BG,
            label: LABEL_WHITE,
          }}
          isDisabled={registrationController.signUpMutation.isPending}
          endContent={
            <button
              type="button"
              className="focus:outline-none"
              type="button"
              onClick={togglePasswordVisibility}
            >
              {isPasswordVisible ? (
                <EyeFilledIcon className="text-xl text-gray-400 pointer-events-none" />
              ) : (
                <EyeSlashFilledIcon className="text-xl text-gray-400 pointer-events-none" />
              )}
            </button>
          }
        />
        <Input
          label="Confirm Password"
          type={isConfirmPasswordVisible ? "text" : "password"}
          value={registrationController.confirmPassword}
          onChange={(e) =>
            registrationController.setConfirmPassword(e.target.value)
          }
          onKeyDown={handleKeyDownRegister}
          classNames={{
            input: INPUT_TEXT_WHITE_AUTOFILL,
            inputWrapper: INPUT_WRAPPER_BG,
            label: LABEL_WHITE,
          }}
          isDisabled={registrationController.signUpMutation.isPending}
          endContent={
            <button
              type="button"
              className="focus:outline-none"
              type="button"
              onClick={toggleConfirmPasswordVisibility}
            >
              {isConfirmPasswordVisible ? (
                <EyeFilledIcon className="text-xl text-gray-400 pointer-events-none" />
              ) : (
                <EyeSlashFilledIcon className="text-xl text-gray-400 pointer-events-none" />
              )}
            </button>
          }
        />
        {registrationController.userPassword &&
          registrationController.confirmPassword &&
          registrationController.userPassword !==
            registrationController.confirmPassword && (
            <p className="text-red-500 text-sm">Passwords do not match</p>
          )}
        {registrationController.errorMessage && (
          <p className="text-red-500 text-sm">
            {registrationController.errorMessage}
          </p>
        )}

        {/* Divider */}
        <div className="flex items-center gap-4 my-4">
          <div className="flex-1 h-px bg-gray-700" />
          <span className="text-gray-400 text-sm">or continue with</span>
          <div className="flex-1 h-px bg-gray-700" />
        </div>

        {/* Google Sign-Up Button */}
        <Button
          className="w-full bg-white hover:bg-gray-100 text-gray-800 font-semibold border border-gray-300"
          onPress={handleGoogleSignIn}
          startContent={
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
          }
        >
          Sign up with Google
        </Button>
      </div>
    </>
  );

  const renderConfirmationForm = () => (
    <>
      <p className="text-gray-400 text-center mb-4">
        We sent a confirmation code to{" "}
        {registrationController.confirmationDestination}
      </p>
      <div className="space-y-4">
        <Input
          label="Confirmation Code"
          type="text"
          value={registrationController.confirmationCode}
          onChange={(e) =>
            registrationController.setConfirmationCode(e.target.value)
          }
          onKeyDown={handleKeyDownRegister}
          classNames={{
            input: INPUT_TEXT_WHITE,
            inputWrapper: INPUT_WRAPPER_BG,
            label: LABEL_WHITE,
          }}
          isDisabled={registrationController.confirmSignUpMutation.isPending}
        />
        {registrationController.errorMessage && (
          <p className="text-red-500 text-sm">
            {registrationController.errorMessage}
          </p>
        )}
      </div>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="md"
      classNames={{
        base: "bg-gray-900 border border-casino-gold/30",
        header: "border-b border-casino-gold/30",
        body: "py-6",
        footer: "border-t border-casino-gold/30",
      }}
    >
      <ModalContent className="bg-gray-900 border border-casino-gold/30">
        {(closeModal) => (
          <>
            <ModalHeader className="flex flex-col items-center gap-4 text-white pt-6">
              <img
                src="/logo.png"
                alt="Backroom Blackjack"
                className="w-32 h-32 mb-2"
              />
              <h2 className="text-2xl font-bold chip-gold">
                Backroom Blackjack
              </h2>
              <Tabs
                selectedKey={selectedTab}
                onSelectionChange={(key) => setSelectedTab(key as string)}
                classNames={{
                  tabList: "bg-gray-800 p-1",
                  tab: "text-white",
                  cursor: "bg-casino-gold",
                }}
              >
                <Tab key="login" title="Login" />
                <Tab key="register" title="Register" />
              </Tabs>
            </ModalHeader>
            <ModalBody>
              {selectedTab === "login"
                ? renderLoginForm()
                : registrationController.activeStep ===
                    REGISTRATION_STEP.ENTER_DETAILS
                  ? renderRegistrationForm()
                  : renderConfirmationForm()}
            </ModalBody>
            <ModalFooter className="flex flex-col gap-2">
              {selectedTab === "login" ? (
                <Button
                  className="w-full bg-casino-gold hover:bg-yellow-600 text-black font-bold"
                  onPress={handleLogin}
                  isDisabled={isLoginDisabled}
                  isLoading={loginController.signInMutation.isPending}
                >
                  Log In
                </Button>
              ) : registrationController.activeStep ===
                REGISTRATION_STEP.ENTER_DETAILS ? (
                <Button
                  className="w-full bg-casino-gold hover:bg-yellow-600 text-black font-bold"
                  onPress={handleRegister}
                  isDisabled={isRegisterDisabled}
                  isLoading={registrationController.signUpMutation.isPending}
                >
                  Create Account
                </Button>
              ) : (
                <Button
                  className="w-full bg-casino-gold hover:bg-yellow-600 text-black font-bold"
                  onPress={handleConfirmCode}
                  isDisabled={!registrationController.confirmationCode}
                  isLoading={
                    registrationController.confirmSignUpMutation.isPending
                  }
                >
                  Confirm
                </Button>
              )}

              <Button
                color="default"
                variant="bordered"
                onPress={closeModal}
                isDisabled={
                  loginController.signInMutation.isPending ||
                  registrationController.signUpMutation.isPending ||
                  registrationController.confirmSignUpMutation.isPending
                }
                className="w-full text-gray-300 border-gray-600 hover:bg-gray-800 mt-2"
              >
                Cancel
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
