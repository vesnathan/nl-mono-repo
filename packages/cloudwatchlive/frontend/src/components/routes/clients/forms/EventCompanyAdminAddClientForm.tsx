"use client";

import React, { forwardRef, useImperativeHandle } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { RHFTextField } from "@/components/common/RHFTextfield";
import { useSaveClientMutation } from "../clientHooks";

const EventCompanySchema = z.object({
  companyName: z.string().nonempty("Company Name is required"),
  contactNumber: z.string().nonempty("Contact Number is required"),
  eventName: z.string().nonempty("Event Name is required"),
  eventDate: z.string().nonempty("Event Date is required"),
});

export const EventCompanyAdminForm = forwardRef(
  ({ onClose }: { onClose: () => void }, ref) => {
    const form = useForm({
      defaultValues: {
        companyName: "",
        contactNumber: "",
        eventName: "",
        eventDate: "",
      },
      resolver: zodResolver(EventCompanySchema),
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
