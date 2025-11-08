"use client";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
} from "@nextui-org/react";
import { useState } from "react";
import Logo from "@/components/common/Logo";
import { useLoginController } from "@/hooks/useLoginController";
import { EyeFilledIcon, EyeSlashFilledIcon } from "@/components/common/EyeSVGR";
import { signInWithRedirect } from "aws-amplify/auth";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionDescription?: string;
  onLoginSuccess?: () => void;
  onSwitchToRegister?: () => void;
}

export function LoginModal({
  isOpen,
  onClose,
  actionDescription = "perform this action",
  onLoginSuccess,
  onSwitchToRegister,
}: LoginModalProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const loginController = useLoginController({
    onLoginSuccess: () => {
      onClose();
      // Call the optional callback instead of reloading
      onLoginSuccess?.();
    },
    captureUnknownError: (err: Error) => {
      console.error(err);
    },
  });

  const {
    userEmail,
    setUserEmail,
    userPassword,
    setUserPassword,
    errorMessage,
    signInMutation,
  } = loginController;

  const isLoginDisabled = !userEmail || !userPassword;

  const togglePasswordVisibility = () =>
    setIsPasswordVisible(!isPasswordVisible);

  const handleLogin = () => {
    signInMutation.mutate({
      username: userEmail,
      password: userPassword,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isLoginDisabled) {
      e.preventDefault();
      handleLogin();
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
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
              <h2 className="text-xl font-bold">Welcome back!</h2>
            </ModalHeader>
            <ModalBody>
              <p className="text-gray-400 text-center mb-4">
                You need to be logged in to {actionDescription}.
              </p>
              <div className="space-y-4">
                <Input
                  label="Email address"
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  onKeyDown={handleKeyDown}
                  classNames={{
                    input:
                      "text-white placeholder:text-gray-500 !text-white [&:-webkit-autofill]:[-webkit-text-fill-color:white] [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_rgb(31,41,55)]",
                    inputWrapper:
                      "bg-gray-800 border-gray-700 group-data-[focus=true]:bg-gray-800 group-data-[focus=true]:border-gray-600 data-[hover=true]:bg-gray-800",
                    label:
                      "text-white group-data-[filled-within=true]:text-white",
                  }}
                  isDisabled={signInMutation.isPending}
                />
                <Input
                  label="Password"
                  type={isPasswordVisible ? "text" : "password"}
                  value={userPassword}
                  onChange={(e) => setUserPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  classNames={{
                    input:
                      "text-white placeholder:text-gray-500 !text-white [&:-webkit-autofill]:[-webkit-text-fill-color:white] [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_rgb(31,41,55)]",
                    inputWrapper:
                      "bg-gray-800 border-gray-700 group-data-[focus=true]:bg-gray-800 group-data-[focus=true]:border-gray-600 data-[hover=true]:bg-gray-800",
                    label:
                      "text-white group-data-[filled-within=true]:text-white",
                  }}
                  isDisabled={signInMutation.isPending}
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
                {errorMessage && (
                  <p className="text-red-500 text-sm">{errorMessage}</p>
                )}
              </div>
            </ModalBody>
            <ModalFooter className="flex flex-col gap-2">
              <Button
                color="primary"
                onPress={handleLogin}
                isDisabled={isLoginDisabled}
                isLoading={signInMutation.isPending}
                className="w-full"
              >
                Log In
              </Button>

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

              <div className="flex flex-col gap-2 w-full">
                <Button
                  variant="bordered"
                  onPress={() => handleSocialLogin("Google")}
                  isDisabled={signInMutation.isPending}
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
                  Continue with Google
                </Button>

                <Button
                  variant="bordered"
                  onPress={() => handleSocialLogin("Facebook")}
                  isDisabled={signInMutation.isPending}
                  className="w-full text-white border-gray-600 hover:bg-gray-800"
                  startContent={
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  }
                >
                  Continue with Facebook
                </Button>

                <Button
                  variant="bordered"
                  onPress={() => handleSocialLogin("Apple")}
                  isDisabled={signInMutation.isPending}
                  className="w-full text-white border-gray-600 hover:bg-gray-800"
                  startContent={
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                    </svg>
                  }
                >
                  Continue with Apple
                </Button>
              </div>

              {onSwitchToRegister && (
                <div className="text-center mt-4">
                  <p className="text-sm text-gray-400">
                    Don&rsquo;t have an account?{" "}
                    <button
                      type="button"
                      onClick={onSwitchToRegister}
                      className="text-primary hover:underline"
                    >
                      Sign up
                    </button>
                  </p>
                </div>
              )}

              <Button
                color="default"
                variant="bordered"
                onPress={closeModal}
                isDisabled={signInMutation.isPending}
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
