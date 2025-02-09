"use client";

import React, { useRef, useState, useEffect } from "react";
import { useUserStore } from "@/stores/userStore";
import { ClientType } from "@/graphql/gqlTypes";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Divider,
} from "@nextui-org/react";
import { CWLButton } from "@/components/common/CWLButton";
import { AddUserForm } from "./forms/AddUserForm";

export const Clients = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentForm, setCurrentForm] = useState<
    "SuperAdmin" | "EventCompanyAdmin" | null
  >(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [totalSteps, setTotalSteps] = useState(1);

  const userGroups = useUserStore((state) => state.userGroups);
  const isSuperAdminUser = userGroups.includes("SuperAdmin" as ClientType);

  // Define separate refs for each form
  const addUserFormRef = useRef<{
    submit: () => void;
    nextStep: () => Promise<boolean>;
    previousStep: () => void;
    reset: () => void;
    getStep: () => number;
    getTotalSteps: () => number;
  } | null>(null);

  useEffect(() => {
    if (currentForm === "SuperAdmin" && addUserFormRef.current) {
      setCurrentStep(addUserFormRef.current.getStep());
      setTotalSteps(addUserFormRef.current.getTotalSteps());
    }
  }, [isModalOpen, currentForm]);

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
    if (currentForm === "SuperAdmin" && addUserFormRef.current) {
      const success = await addUserFormRef.current.nextStep();
      if (success) setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentForm === "SuperAdmin" && addUserFormRef.current) {
      addUserFormRef.current.previousStep();
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleReset = () => {
    if (currentForm === "SuperAdmin" && addUserFormRef.current) {
      addUserFormRef.current.reset();
      setCurrentStep(1);
    }
  };

  return (
    <>
      <Modal
        isOpen={isModalOpen}
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
      </Modal>

      <CWLButton buttonText="New Client" onClick={handleOpenModal} />
    </>
  );
};
