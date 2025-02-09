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
import { RHFSelect } from "@/components/common/RHFSelect";

/** Types for your step config */
export type FormFieldType = "text" | "select";

/**
 * We organize fields based on their `row` property.
 */
export type FormStep<T extends Record<string, unknown>> = {
  id: string;
  schema: ZodObject<ZodRawShape>;
  fields: {
    name: FieldPath<T>;
    label: string;
    placeholder?: string;
    type: FormFieldType;
    row: number;
    options?: { value: string; label: string }[];
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

    // Group fields by row
    const groupedFields = steps[currentStep].fields.reduce(
      (acc, field) => {
        if (!acc[field.row]) acc[field.row] = [];
        acc[field.row].push(field);
        return acc;
      },
      {} as Record<number, FormStep<T>["fields"]>,
    );

    return (
      <Modal isOpen={isOpen} onClose={onClose} aria-labelledby="modal-title">
        <ModalContent>
          <ModalHeader id="modal-title">{modalTitle}</ModalHeader>

          <Divider />
          <ModalBody className="mb-5">
            {/* Step Indicators */}
            {steps.length > 1 && (
              <div className="relative my-5">
                <div className="flex justify-between mb-2">
                  {steps.map((step, index) => (
                    <span
                      key={step.id}
                      className={`text-sm font-medium ${
                        index === currentStep ? "text-primary" : "text-gray-500"
                      }`}
                      style={{ textAlign: "center", width: "100%" }}
                    >
                      {index === currentStep && step.id}
                    </span>
                  ))}
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-lg">
                  <div
                    className="h-2 bg-primary rounded-lg transition-all"
                    style={{
                      width: `${((currentStep + 1) / steps.length) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}
            <div className="space-y-4">
              {Object.entries(groupedFields).map(([row, fields]) => (
                <div
                  key={row}
                  className={`grid ${
                    fields.length === 1 ? "grid-cols-1" : "grid-cols-2"
                  } gap-4`}
                >
                  {fields.map((field) => (
                    <div key={field.name}>
                      {field.type === "select" ? (
                        <RHFSelect
                          form={form}
                          fieldPath={field.name}
                          label={field.label}
                          placeholder={field.placeholder}
                        />
                      ) : (
                        <RHFTextField
                          form={form}
                          fieldPath={field.name}
                          label={field.label}
                          placeholder={field.placeholder}
                          type={field.type}
                        />
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
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
