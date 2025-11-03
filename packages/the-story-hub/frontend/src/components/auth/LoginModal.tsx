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
import Logo from "@/components/common/Logo";
import { useLoginController } from "@/hooks/useLoginController";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionDescription?: string;
}

export function LoginModal({
  isOpen,
  onClose,
  actionDescription = "perform this action",
}: LoginModalProps) {
  const loginController = useLoginController({
    onLoginSuccess: () => {
      onClose();
      // Reload the page to refresh auth state
      window.location.reload();
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

  const handleLogin = () => {
    signInMutation.mutate({
      username: userEmail,
      password: userPassword,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isLoginDisabled) {
      handleLogin();
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
                    input: "bg-gray-800 text-white",
                    inputWrapper: "bg-gray-800 border-gray-700",
                    label: "text-gray-300",
                  }}
                  isDisabled={signInMutation.isPending}
                />
                <Input
                  label="Password"
                  type="password"
                  value={userPassword}
                  onChange={(e) => setUserPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  classNames={{
                    input: "bg-gray-800 text-white",
                    inputWrapper: "bg-gray-800 border-gray-700",
                    label: "text-gray-300",
                  }}
                  isDisabled={signInMutation.isPending}
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
              <Button
                color="default"
                variant="bordered"
                onPress={closeModal}
                isDisabled={signInMutation.isPending}
                className="w-full text-gray-300 border-gray-600 hover:bg-gray-800"
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
