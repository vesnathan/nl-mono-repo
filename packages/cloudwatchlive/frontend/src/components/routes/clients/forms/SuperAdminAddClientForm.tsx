"use client";

import React, { forwardRef, useImperativeHandle } from "react";
import { useForm } from "react-hook-form";
import {
  CWLClient,
  createEmptySuperAdminClient,
  OrgDetailsSchema,
  ContactDetailsSchema,
} from "shared/types/CWLClientSchemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { RHFSelect } from "@/components/common/RHFSelect";
import { RHFTextField } from "@/components/common/RHFTextfield";
import { useSaveClientMutation } from "../clientHooks";

export const SuperAdminForm = forwardRef(
  ({ onClose }: { onClose: () => void }, ref) => {
    const form = useForm<CWLClient>({
      defaultValues: createEmptySuperAdminClient(),
      resolver: zodResolver(OrgDetailsSchema.merge(ContactDetailsSchema)),
    });

    const submitMutation = useSaveClientMutation({
      onSuccess: () => {
        onClose();
      },
    });

    useImperativeHandle(ref, () => ({
      submit: () => {
        form.handleSubmit((data) => {
          submitMutation.mutate(data);
        })();
      },
    }));

    return (
      <form className="space-y-4">
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
      </form>
    );
  },
);
