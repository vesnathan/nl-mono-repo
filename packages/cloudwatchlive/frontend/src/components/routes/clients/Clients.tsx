"use client";

import React, { useRef, useState } from "react";
import { useUserStore } from "@/stores/userStore";
import { ClientType } from "@/types/gqlTypes";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Divider,
} from "@nextui-org/react";
import type { ModalProps } from "@nextui-org/modal";
import { CWLButton } from "@/components/common/CWLButton";
import { AddUserForm } from "./forms/AddUserForm";
// Cast Modal to a component typed with ModalProps (avoids `any`).
const ModalAny = Modal as unknown as React.ComponentType<ModalProps>;

export const Clients = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentForm, setCurrentForm] = useState<
    "SuperAdmin" | "EventCompanyAdmin" | null
  >(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [totalSteps] = useState(1);

  const user = useUserStore((state) => state.user);
  const isSuperAdminUser = user.clientType.includes(ClientType.SuperAdmin);

  // useEffect(() => {
  //   console.log('Is SuperAdmin User (useEffect):', isSuperAdminUser);
  //   console.log('User clientType (useEffect):', user.clientType);
  // }, [user.clientType, isSuperAdminUser]);

  // Define a ref for the form. AddUserForm exposes submit() and reset() via useImperativeHandle.
  const addUserFormRef = useRef<{
    submit: () => void;
    reset: () => void;
  } | null>(null);

  const handleOpenModal = () => {
    if (isSuperAdminUser) setCurrentForm("SuperAdmin");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentForm(null);
    setCurrentStep(1);
  };

  const handleSubmit = () => {
    if (currentForm === "SuperAdmin") {
      addUserFormRef.current?.submit();
    }
  };

  const handleNext = async () => {
    // No-op: AddUserForm is a single-step form in this implementation.
  };

  const handlePrevious = () => {
    // No-op: single-step form
  };

  const handleReset = () => {
    if (currentForm === "SuperAdmin" && addUserFormRef.current) {
      addUserFormRef.current.reset();
      setCurrentStep(1);
    }
  };

  return (
    <>
      {isModalOpen && (
        <ModalAny
          onClose={handleCloseModal}
          aria-labelledby="client-modal-title"
        >
          <ModalContent>
            <ModalHeader id="client-modal-title">Add New Client</ModalHeader>
            <Divider />
            <ModalBody className="mb-5">
              {currentForm === "SuperAdmin" && (
                <AddUserForm ref={addUserFormRef} onClose={handleCloseModal} />
              )}
            </ModalBody>
            <Divider />
            <ModalFooter className="flex justify-between">
              {/* Reset Button (Hard Left) */}
              <CWLButton
                buttonText="Reset"
                onClick={handleReset}
                color="secondary"
              />

              <div className="flex space-x-2">
                {/* Previous Button (Only if not on Step 1) */}
                {totalSteps > 1 && currentStep > 1 && (
                  <CWLButton
                    buttonText="Previous"
                    onClick={handlePrevious}
                    color="secondary"
                  />
                )}
                {/* Next Button (Only if not on last step) */}
                {totalSteps > 1 && currentStep < totalSteps && (
                  <CWLButton
                    buttonText="Next"
                    onClick={handleNext}
                    color="primary"
                  />
                )}
                {/* Submit Button (Only on last step) */}
                {currentStep === totalSteps && (
                  <CWLButton
                    buttonText="Submit"
                    onClick={handleSubmit}
                    color="primary"
                  />
                )}
              </div>
            </ModalFooter>
          </ModalContent>
        </ModalAny>
      )}

      <CWLButton buttonText="New Client" onClick={handleOpenModal} />
    </>
  );
};
