"use client";

import { forwardRef, useImperativeHandle, useState } from "react";
import {
  useForm,
  UseFormReturn,
  DefaultValues,
  FieldPath,
} from "react-hook-form";
import { ZodObject, ZodRawShape } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { RHFTextField } from "@/components/common/RHFTextfield";
import {
  Divider,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@nextui-org/react";
import { CWLButton } from "@/components/common/CWLButton";

export type FormStep<T extends Record<string, unknown>> = {
  id: string;
  schema: ZodObject<ZodRawShape>;
  fields: {
    name: FieldPath<T>;
    label: string;
    placeholder?: string;
    type?: string;
  }[];
};

export type FormModalProps<T extends Record<string, unknown>> = {
  initialValues: DefaultValues<T>;
  steps: FormStep<T>[];
  onSubmit: (data: T) => void;
  isOpen: boolean;
  onClose: () => void;
  modalTitle: string;
};

export const FormModal = forwardRef(
  <T extends Record<string, unknown>>(
    {
      initialValues,
      steps,
      onSubmit,
      isOpen,
      onClose,
      modalTitle = "Form Modal",
    }: FormModalProps<T>,
    ref: React.ForwardedRef<UseFormReturn<T>>,
  ) => {
    const [currentStep, setCurrentStep] = useState(0);

    const currentStepSchema = steps[currentStep].schema;

    const form = useForm<T>({
      defaultValues: initialValues,
      resolver: zodResolver(currentStepSchema),
    });

    useImperativeHandle(ref, () => form);

    const handleNext = async () => {
      const isValid = await form.trigger();
      if (isValid && currentStep < steps.length - 1) {
        setCurrentStep((prev) => prev + 1);
      }
    };

    const handlePrevious = () => {
      if (currentStep > 0) {
        setCurrentStep((prev) => prev - 1);
      }
    };

    const handleSubmit = form.handleSubmit((data) => {
      onSubmit(data);
    });

    return (
      <Modal isOpen={isOpen} onClose={onClose} aria-labelledby="modal-title">
        <ModalContent>
          <ModalHeader id="modal-title">{modalTitle}</ModalHeader>

          <Divider />
          <ModalBody className="mb-5">
            {steps[currentStep].fields.map((field) => (
              <RHFTextField
                key={field.name}
                form={form}
                fieldPath={field.name}
                label={field.label}
                placeholder={field.placeholder}
              />
            ))}
          </ModalBody>
          <Divider />
          <ModalFooter>
            <CWLButton
              buttonText="Reset"
              onClick={() => form.reset()}
              color="secondary"
            />
            {currentStep > 0 && (
              <CWLButton
                buttonText="Previous"
                onClick={handlePrevious}
                color="secondary"
              />
            )}
            {currentStep < steps.length - 1 ? (
              <CWLButton
                buttonText="Next"
                onClick={handleNext}
                color="primary"
              />
            ) : (
              <CWLButton
                buttonText="Submit"
                onClick={handleSubmit}
                color="primary"
              />
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  },
);
