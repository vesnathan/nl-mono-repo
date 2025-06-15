'use client';

import React from "react";
import { useUserStore } from "@/stores/userStore";
import { ClientType } from "@/graphql/gqlTypes";
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

  // Log user object and clientType for debugging
  console.log("User from store:", user);
  console.log("User clientType:", user.clientType);

  const isSuperAdmin = user.clientType.includes(ClientType.SuperAdmin);
  // Log isSuperAdmin status
  console.log("Is SuperAdmin:", isSuperAdmin);

  return (
    <div>
      <p>Hello</p>
      {isSuperAdmin && (
        <Button onPress={onOpen} color="primary">
          Create User
        </Button>
      )}
      <Modal isOpen={isOpen} onClose={onClose} placement="top-center">
        <ModalContent>
          {(modalClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Create New User
              </ModalHeader>
              <ModalBody>
                <CreateUserForm onClose={modalClose} onSubmitSuccess={() => { console.log('Submit success!'); modalClose(); }} />
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};
