"use client";

import React, { useRef, useState } from "react";
import { useUserStore } from "@/stores/userStore";
import { UserGroup } from "@/graphql/gqlTypes";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Divider,
} from "@nextui-org/react";
import { CWLButton } from "@/components/common/CWLButton";
import { EventCompanyAdminForm } from "./forms/EventCompanyAdminAddClientForm";
import { SuperAdminForm } from "./forms/SuperAdminAddClientForm";

export const Clients = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentForm, setCurrentForm] = useState<
    "SuperAdmin" | "EventCompanyAdmin" | null
  >(null);

  const userGroups = useUserStore((state) => state.userGroups);
  const isSuperAdminUser = userGroups.includes("SuperAdmin" as UserGroup);
  const isEventCompanyAdmin = userGroups.includes(
    "EventCompanyAdmin" as UserGroup,
  );

  // Create refs for both forms
  const superAdminFormRef = useRef<{ submit: () => void } | null>(null);
  const eventCompanyAdminFormRef = useRef<{ submit: () => void } | null>(null);

  const handleOpenModal = () => {
    if (isSuperAdminUser) setCurrentForm("SuperAdmin");
    else if (isEventCompanyAdmin) setCurrentForm("EventCompanyAdmin");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentForm(null);
  };

  const handleSubmit = () => {
    if (currentForm === "SuperAdmin") {
      superAdminFormRef.current?.submit();
    } else if (currentForm === "EventCompanyAdmin") {
      eventCompanyAdminFormRef.current?.submit();
    }
  };

  return (
    <>
      {/* Common Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        aria-labelledby="client-modal-title"
      >
        <ModalContent>
          <ModalHeader id="client-modal-title">
            {currentForm === "SuperAdmin"
              ? "Add New Client (Super Admin)"
              : "Add New Client (Event Company Admin)"}
          </ModalHeader>
          <Divider />
          <ModalBody className="mb-5">
            {currentForm === "SuperAdmin" && (
              <SuperAdminForm
                ref={superAdminFormRef}
                onClose={handleCloseModal}
              />
            )}
            {currentForm === "EventCompanyAdmin" && (
              <EventCompanyAdminForm
                ref={eventCompanyAdminFormRef}
                onClose={handleCloseModal}
              />
            )}
          </ModalBody>
          <Divider />
          <ModalFooter>
            <CWLButton
              buttonText="Close"
              onClick={handleCloseModal}
              color="secondary"
            />
            <CWLButton
              buttonText="Submit"
              onClick={handleSubmit}
              color="primary"
            />
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Trigger Button */}
      <CWLButton buttonText="New Client" onClick={handleOpenModal} />
    </>
  );
};
