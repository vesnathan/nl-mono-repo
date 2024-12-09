"use client";

import { CWLButton } from "@/components/common/CWLButton";
import { UserGroup } from "@/graphql/gqlTypes";
import { useUserStore } from "@/stores/userStore";
import {
  Divider,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@nextui-org/react";
import { useRef, useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { CWLClient } from "shared/types/CWLClient";
import { useSaveClientMutation } from "./clientHooks";
import {
  SuperAdminAddClientForm,
  SuperAdminAddClientFormRefType,
} from "./forms/SuperAdminAddClientForm";

export const Clients = () => {
  //
  const [showAddNewUserModal, setShowAddNewUserModal] = useState(false);
  const user = useUserStore((state) => state.user);
  const isSuperAdminUser = user.userGroups?.includes("SuperAdmin" as UserGroup);

  const SuperAdminAddClientFormRef =
    useRef<SuperAdminAddClientFormRefType>(null);

  const submitMutation = useSaveClientMutation({
    onSuccess: () => {},
  });

  const onSubmit = async () => {
    function callFormSubmit<T extends CWLClient>(
      form: UseFormReturn<T> | undefined,
    ) {
      if (form) {
        form.handleSubmit((data) => {
          return submitMutation.mutate(data);
        }, console.error)();
      }
    }

    if (isSuperAdminUser) {
      callFormSubmit(SuperAdminAddClientFormRef.current?.form);
    }
  };

  return (
    <>
      {/* Modal Component */}
      <Modal
        title="Add new client"
        isOpen={showAddNewUserModal}
        onClose={() => setShowAddNewUserModal(false)}
        aria-labelledby="modal-title"
        className=""
      >
        <ModalContent>
          <ModalHeader id="modal-title">Add New Client</ModalHeader>
          <ModalBody className="p-0 m-0">
            <Divider />
            <div className="p-5">
              <SuperAdminAddClientForm ref={SuperAdminAddClientFormRef} />
            </div>
            <Divider />
          </ModalBody>
          <ModalFooter>
            <CWLButton
              buttonText="Cancel"
              onClick={() => setShowAddNewUserModal(false)}
              color="transparent"
            />
            <CWLButton buttonText="Save" onClick={onSubmit} />
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Button to Open Modal */}
      <CWLButton
        buttonText="New client"
        onClick={() => setShowAddNewUserModal(true)}
      />
    </>
  );
};
