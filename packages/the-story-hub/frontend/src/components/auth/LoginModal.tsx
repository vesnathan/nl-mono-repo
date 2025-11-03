"use client";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@nextui-org/react";
import { useRouter } from "next/navigation";

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
  const router = useRouter();

  const handleLogin = () => {
    onClose();
    router.push("/login");
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      classNames={{
        base: "bg-gray-900",
        header: "border-b border-gray-700",
        body: "py-6",
        footer: "border-t border-gray-700",
      }}
    >
      <ModalContent className="bg-gray-900">
        {(closeModal) => (
          <>
            <ModalHeader className="flex flex-col gap-1 text-white">
              Login Required
            </ModalHeader>
            <ModalBody>
              <p className="text-gray-300">
                You need to be logged in to {actionDescription}.
              </p>
              <p className="text-sm text-gray-400">
                Create a free account or sign in to participate in the
                community!
              </p>
            </ModalBody>
            <ModalFooter>
              <Button color="default" variant="light" onPress={closeModal}>
                Cancel
              </Button>
              <Button color="primary" onPress={handleLogin}>
                Go to Login
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
