"use client";

import React from "react";
import { useUserStore } from "@/stores/userStore";
import { ClientType } from "@/types/gqlTypes";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  useDisclosure,
} from "@nextui-org/react";
import { CWLButton } from "@/components/common/CWLButton";
import { CreateUserForm } from "./CreateUserForm";

export const Dashboard = () => {
  const { user } = useUserStore();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const isSuperAdmin = user.clientType.includes(ClientType.SuperAdmin);

  return (
    <div>
      {isSuperAdmin && (
        <CWLButton buttonText="Create User" onClick={onOpen} color="primary" />
      )}
      <Modal isOpen={isOpen} onClose={onClose} placement="top-center">
        <ModalContent className="h-[80vh]">
          {(modalClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Create New User
              </ModalHeader>
              <ModalBody>
                <CreateUserForm
                  onClose={modalClose}
                  onSubmitSuccess={() => {
                    modalClose();
                  }}
                />
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};
