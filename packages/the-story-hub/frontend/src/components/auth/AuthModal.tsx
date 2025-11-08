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
import { useState, useEffect } from "react";
import Logo from "@/components/common/Logo";
import { useLoginController } from "@/hooks/useLoginController";
import {
  useRegistrationController,
  REGISTRATION_STEP,
} from "@/hooks/useRegistrationController";
import { EyeFilledIcon, EyeSlashFilledIcon } from "@/components/common/EyeSVGR";
import { signInWithRedirect } from "aws-amplify/auth";
import { getSiteSettingsAPI } from "@/lib/api/settings";
import type { SiteSettings } from "@/types/SettingsSchemas";

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
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);

  // Fetch site settings on mount to determine enabled OAuth providers
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await getSiteSettingsAPI();
        setSiteSettings(settings);
      } catch (error) {
        console.error("Failed to load site settings:", error);
        // Default to Google enabled if settings fail to load
        setSiteSettings({
          googleOAuthEnabled: true,
          facebookOAuthEnabled: false,
          appleOAuthEnabled: false,
          grantOGBadgeToPatreonSupporters: false,
          adsEnabled: false,
          adsensePublisherId: null,
          adsenseVerificationCode: null,
          showAdsOnHomepage: false,
          showAdsOnStoryEnd: false,
          showAdsInFooter: false,
          homepageAdSlot: null,
          storyEndAdSlot: null,
          footerAdSlot: null,
          sentryDsn: null,
          sentryEnabled: false,
          updatedAt: new Date().toISOString(),
          updatedBy: null,
        });
      }
    };
    loadSettings();
  }, []);

  const loginController = useLoginController({
    onLoginSuccess: () => {
      onClose();
      onAuthSuccess?.();
    },
    captureUnknownError: (err: Error) => {
      console.error(err);
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
      email: registrationController.userEmail,
      password: registrationController.userPassword,
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

  const handleSocialLogin = async (
    provider: "Google" | "Facebook" | "Apple",
  ) => {
    try {
      await signInWithRedirect({ provider });
    } catch (error) {
      console.error(`Error signing in with ${provider}:`, error);
    }
  };

  // Check if any OAuth providers are enabled
  const hasEnabledOAuthProviders =
    siteSettings?.googleOAuthEnabled ||
    siteSettings?.facebookOAuthEnabled ||
    siteSettings?.appleOAuthEnabled;

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
        Join The Story Hub to start creating and contributing to stories
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
          isInvalid={!!registrationController.usernameError}
          errorMessage={registrationController.usernameError}
          description={
            registrationController.isCheckingUsername
              ? "Checking availability..."
              : registrationController.username.length >= 3 &&
                  !registrationController.usernameError
                ? "Username available"
                : undefined
          }
          color={
            registrationController.usernameError
              ? "danger"
              : registrationController.username.length >= 3 &&
                  !registrationController.usernameError &&
                  !registrationController.isCheckingUsername
                ? "success"
                : "default"
          }
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
        base: "bg-gray-900 border border-gray-700",
        header: "border-b border-gray-700",
        body: "py-6",
        footer: "border-t border-gray-700",
      }}
    >
      <ModalContent className="bg-gray-900 border border-gray-700">
        {(closeModal) => (
          <>
            <ModalHeader className="flex flex-col items-center gap-4 text-white pt-6">
              <Logo width={150} height={80} />
              <Tabs
                selectedKey={selectedTab}
                onSelectionChange={(key) => setSelectedTab(key as string)}
                classNames={{
                  tabList: "bg-gray-800 p-1",
                  tab: "text-white",
                  cursor: "bg-orange-600",
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
                <>
                  <Button
                    color="primary"
                    onPress={handleLogin}
                    isDisabled={isLoginDisabled}
                    isLoading={loginController.signInMutation.isPending}
                    className="w-full"
                  >
                    Log In
                  </Button>

                  {hasEnabledOAuthProviders && (
                    <>
                      <div className="relative w-full my-2">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-gray-700" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="px-2 bg-gray-900 text-gray-400">
                            Or continue with
                          </span>
                        </div>
                      </div>

                      {siteSettings?.googleOAuthEnabled && (
                        <Button
                          variant="bordered"
                          onPress={() => handleSocialLogin("Google")}
                          isDisabled={loginController.signInMutation.isPending}
                          className="w-full text-white border-gray-600 hover:bg-gray-800"
                          startContent={
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                              <path
                                fill="currentColor"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                              />
                              <path
                                fill="currentColor"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                              />
                              <path
                                fill="currentColor"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                              />
                              <path
                                fill="currentColor"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                              />
                            </svg>
                          }
                        >
                          Google
                        </Button>
                      )}

                      {siteSettings?.facebookOAuthEnabled && (
                        <Button
                          variant="bordered"
                          onPress={() => handleSocialLogin("Facebook")}
                          isDisabled={loginController.signInMutation.isPending}
                          className="w-full text-white border-gray-600 hover:bg-gray-800"
                          startContent={
                            <svg
                              className="w-5 h-5"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                            >
                              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                            </svg>
                          }
                        >
                          Facebook
                        </Button>
                      )}

                      {siteSettings?.appleOAuthEnabled && (
                        <Button
                          variant="bordered"
                          onPress={() => handleSocialLogin("Apple")}
                          isDisabled={loginController.signInMutation.isPending}
                          className="w-full text-white border-gray-600 hover:bg-gray-800"
                          startContent={
                            <svg
                              className="w-5 h-5"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                            >
                              <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                            </svg>
                          }
                        >
                          Apple
                        </Button>
                      )}
                    </>
                  )}
                </>
              ) : registrationController.activeStep ===
                REGISTRATION_STEP.ENTER_DETAILS ? (
                <Button
                  color="primary"
                  onPress={handleRegister}
                  isDisabled={isRegisterDisabled}
                  isLoading={registrationController.signUpMutation.isPending}
                  className="w-full"
                >
                  Create Account
                </Button>
              ) : (
                <Button
                  color="primary"
                  onPress={handleConfirmCode}
                  isDisabled={!registrationController.confirmationCode}
                  isLoading={
                    registrationController.confirmSignUpMutation.isPending
                  }
                  className="w-full"
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
