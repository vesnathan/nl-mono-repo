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
    </div>
  );

  const renderRegistrationForm = () => (
    <>
      <p className="text-gray-400 text-center mb-4">
        Join Card Counting Trainer and start mastering your skills
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
              <h2 className="text-2xl font-bold chip-gold">
                Card Counting Trainer
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
