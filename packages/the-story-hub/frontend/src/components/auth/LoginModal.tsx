'use client';

import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from '@nextui-org/react';
import { useRouter } from 'next/navigation';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionDescription?: string;
}

export function LoginModal({ isOpen, onClose, actionDescription = "perform this action" }: LoginModalProps) {
  const router = useRouter();

  const handleLogin = () => {
    onClose();
    router.push('/login');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">Login Required</ModalHeader>
        <ModalBody>
          <p>You need to be logged in to {actionDescription}.</p>
          <p className="text-sm text-default-500">
            Create a free account or sign in to participate in the community!
          </p>
        </ModalBody>
        <ModalFooter>
          <Button color="default" variant="light" onPress={onClose}>
            Cancel
          </Button>
          <Button color="primary" onPress={handleLogin}>
            Go to Login
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
