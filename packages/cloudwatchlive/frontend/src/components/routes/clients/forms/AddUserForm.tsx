/* eslint-disable sonarjs/cognitive-complexity */

"use client";

import React, { forwardRef, useImperativeHandle, useState } from "react";
import { useForm } from "react-hook-form";
import { ZodError } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { RHFSelect } from "@/components/common/RHFSelect";
import { RHFTextField } from "@/components/common/RHFTextfield";

import { createEmptyCWLOrg, CWLOrgSchema } from "shared/types/CWLOrgSchemas";
import {
  createEmptyCWLUser,
  CWLUserFormValidationSchema,
  CWLUserSchema,
} from "shared/types/CWLUserSchemas";
import { ClientType, CWLUser } from "@/graphql/gqlTypes";
import { useUserStore } from "@/stores/userStore";
import { useGetUserJobRoles } from "@/hooks/useGetUserJobRoles";
import { useSaveSuperAdminClientMutation } from "../clientHooks";

export const AddUserForm = forwardRef(
  ({ onClose }: { onClose: () => void }, ref) => {
    const [step, setStep] = useState(1);
    const totalSteps = 2;
    const user = useUserStore((state) => state.user);
    const jobRolesForUserGroup = useGetUserJobRoles(user.clientType);

    const form = useForm<CWLUser>({
      defaultValues: {
        ...createEmptyCWLUser(),
        ...createEmptyCWLOrg(),
      },
      resolver: zodResolver(CWLUserFormValidationSchema),
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
          form.setError(path[0] as keyof CWLUser, {
            message,
          });
        }
      });
    };

    useImperativeHandle(ref, () => ({
      submit: () => {
        if (step === totalSteps) {
          // Final submission: run the full validation
          form.handleSubmit((data: CWLUser) => {
            submitMutation.mutate(data);
          })();
        }
      },
      nextStep: async () => {
        const values = form.getValues();
        try {
          if (step === 1) {
            // Validate Step 1 fields only
            CWLOrgSchema.parse(values);
            setStep(2);
          } else if (step === 2) {
            // Validate Step 2 fields only
            CWLUserSchema.parse(values);
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
              fieldPath="userFirstName"
              label="Contact First Name"
              placeholder="Enter contact first name"
            />
            <RHFTextField
              form={form}
              fieldPath="userLastName"
              label="Contact Last Name"
              placeholder="Enter contact last name"
            />
            <RHFTextField
              form={form}
              fieldPath="userEmail"
              label="Contact Email"
              placeholder="Enter contact email"
            />
            <RHFTextField
              form={form}
              fieldPath="userPhone"
              label="Contact Phone"
              placeholder="Enter contact phone"
            />
            <RHFSelect
              form={form}
              fieldPath="userRole"
              label="Contact Role"
              placeholder="Select contact role"
              options={jobRolesForUserGroup}
            />
            <RHFSelect
              form={form}
              fieldPath="organizationId"
              label="Organisation Name"
              placeholder="Enter organisation name"
              options={[
                { id: "1", value: "Org 1" },
                { id: "2", value: "Org 2" },
              ]}
            />
          </>
        )}
      </form>
    );
  },
);

AddUserForm.displayName = "SuperAdminForm";
