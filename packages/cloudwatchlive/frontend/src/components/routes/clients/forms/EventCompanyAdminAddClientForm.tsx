// EventCompanyAdminForm.tsx

"use client";

import React, { forwardRef, useImperativeHandle } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RHFTextField } from "@/components/common/RHFTextfield";
import {
  EventCompanyClient,
  EventCompanyClientSchema,
  createEmptyEventCompanyClient,
} from "shared/types/CWLClientSchemas";
import { useSaveEventCompanyAdimnClientMutation } from "../clientHooks";

export const EventCompanyAdminForm = forwardRef(
  ({ onClose }: { onClose: () => void }, ref) => {
    const totalSteps = 1; // Single-step form
    const form = useForm<EventCompanyClient>({
      defaultValues: createEmptyEventCompanyClient(),
      resolver: zodResolver(EventCompanyClientSchema), // Correct resolver
    });

    const submitMutation = useSaveEventCompanyAdimnClientMutation({
      onSuccess: () => {
        onClose();
      },
    });

    useImperativeHandle(ref, () => ({
      submit: () => {
        form.handleSubmit((data: EventCompanyClient) => {
          submitMutation.mutate(data);
        })();
      },
      nextStep: async () => {
        return form.trigger();
      },
      previousStep: () => {},
      reset: () => form.reset(),
      getStep: () => 1,
      getTotalSteps: () => totalSteps,
    }));

    return (
      <form className="space-y-4">
        <RHFTextField
          form={form}
          fieldPath="companyName"
          label="Company Name"
          placeholder="Enter company name"
        />
        <RHFTextField
          form={form}
          fieldPath="contactNumber"
          label="Contact Number"
          placeholder="Enter contact number"
        />
        <RHFTextField
          form={form}
          fieldPath="eventName"
          label="Event Name"
          placeholder="Enter event name"
        />
        <RHFTextField
          form={form}
          fieldPath="eventDate"
          label="Event Date"
          type="date"
          placeholder="Select event date"
        />
      </form>
    );
  },
);
