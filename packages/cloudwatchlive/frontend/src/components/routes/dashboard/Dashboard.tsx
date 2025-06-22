'use client';

import React from "react";
import { useUserStore } from "@/stores/userStore";
import { ClientType } from "@/types/gqlTypes";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Button,
  useDisclosure,
} from "@nextui-org/react";
import { CreateUserForm } from "./CreateUserForm";

export const Dashboard = () => {
  const { user } = useUserStore();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const isSuperAdmin = user.clientType.includes(ClientType.SuperAdmin);

  return (
    <div>
      {isSuperAdmin && (
        <Button onPress={onOpen} color="primary">
          Create User
        </Button>
      )}
      <Modal isOpen={isOpen} onClose={onClose} placement="top-center">
        <ModalContent className="h-[80vh]">
          {(modalClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Create New User
              </ModalHeader>
              <ModalBody>
                <CreateUserForm onClose={modalClose} onSubmitSuccess={() => { modalClose(); }} />
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};
