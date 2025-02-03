// SuperAdminForm.tsx

"use client";

import React, { forwardRef, useImperativeHandle, useState } from "react";
import { useForm } from "react-hook-form";
import { ZodError } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Client_CWLSuperAdminClient,
  createEmptySuperAdminClient,
  Client_CWLSuperAdminClientSchema,
  SuperAdminStep1Schema,
  SuperAdminStep2Schema,
} from "shared/types/CWLClientSchemas";
import { RHFSelect } from "@/components/common/RHFSelect";
import { RHFTextField } from "@/components/common/RHFTextfield";
import { useSaveSuperAdminClientMutation } from "../clientHooks";

export const SuperAdminForm = forwardRef(
  ({ onClose }: { onClose: () => void }, ref) => {
    const [step, setStep] = useState(1);
    const totalSteps = 2;

    // Use the full schema for the final submission.
    const form = useForm<Client_CWLSuperAdminClient>({
      defaultValues: createEmptySuperAdminClient(),
      resolver: zodResolver(Client_CWLSuperAdminClientSchema),
    });

    const submitMutation = useSaveSuperAdminClientMutation({
      onSuccess: () => {
        onClose();
      },
    });

    // Helper: Map Zod errors to React Hook Form errors.
    const mapZodErrorsToForm = (error: ZodError) => {
      error.errors.forEach(({ path, message }) => {
        if (path.length > 0) {
          form.setError(path[0] as keyof Client_CWLSuperAdminClient, {
            message,
          });
        }
      });
    };

    useImperativeHandle(ref, () => ({
      submit: () => {
        if (step === totalSteps) {
          // Final submission: run the full validation
          form.handleSubmit((data: Client_CWLSuperAdminClient) => {
            submitMutation.mutate(data);
          })();
        }
      },
      nextStep: async () => {
        const values = form.getValues();
        try {
          if (step === 1) {
            // Validate Step 1 fields only
            SuperAdminStep1Schema.parse(values);
            setStep(2);
          } else if (step === 2) {
            // Optionally, validate Step 2 if needed.
            SuperAdminStep2Schema.parse(values);
          }
          return true;
        } catch (err) {
          if (err instanceof ZodError) {
            mapZodErrorsToForm(err);
          }
          return false;
        }
      },
      previousStep: () => {
        setStep((prev) => Math.max(prev - 1, 1));
      },
      reset: () => {
        form.reset();
        setStep(1);
      },
      getStep: () => step,
      getTotalSteps: () => totalSteps,
    }));

    return (
      <form className="space-y-4">
        {step === 1 && (
          <>
            <RHFTextField
              form={form}
              fieldPath="orgName"
              label="Organisation Name"
              placeholder="Enter organisation name"
            />
            <RHFTextField
              form={form}
              fieldPath="addressLine1"
              label="Address Line 1"
              placeholder="Enter address line 1"
            />
            <RHFTextField
              form={form}
              fieldPath="addressLine2"
              label="Address Line 2"
              placeholder="Enter address line 2"
            />
            <div className="grid grid-cols-2 gap-4">
              <RHFTextField
                form={form}
                fieldPath="city"
                label="City"
                placeholder="Enter city"
              />
              <RHFTextField
                form={form}
                fieldPath="state"
                label="State"
                placeholder="Enter state"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <RHFTextField
                form={form}
                fieldPath="country"
                label="Country"
                placeholder="Enter country"
              />
              <RHFTextField
                form={form}
                fieldPath="postalCode"
                label="Postal Code"
                placeholder="Enter postal code"
              />
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <RHFTextField
              form={form}
              fieldPath="contactName"
              label="Contact Name"
              placeholder="Enter contact name"
            />
            <RHFTextField
              form={form}
              fieldPath="contactEmail"
              label="Contact Email"
              placeholder="Enter contact email"
            />
            <RHFTextField
              form={form}
              fieldPath="contactPhone"
              label="Contact Phone"
              placeholder="Enter contact phone"
            />
            <RHFSelect
              form={form}
              fieldPath="contactRole"
              label="Contact Role"
              placeholder="Select contact role"
            />
          </>
        )}
      </form>
    );
  },
);
