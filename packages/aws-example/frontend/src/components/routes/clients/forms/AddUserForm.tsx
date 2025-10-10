/* eslint-disable sonarjs/cognitive-complexity */

"use client";

import React, { forwardRef, useImperativeHandle } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { RHFSelect } from "@/components/common/RHFSelect";
import { RHFTextField } from "@/components/common/RHFTextfield";

import {
  createEmptyawsbUser,
  awsbUserFormValidationSchema,
} from "@/types/awsbUserSchemas";
import { awsbUser } from "@/types/gqlTypes";
import { useUserStore } from "@/stores/userStore";
import { useGetUserJobRoles } from "@/hooks/useGetUserJobRoles";
import { useSaveSuperAdminClientMutation } from "../clientHooks";

export const AddUserForm = forwardRef(
  ({ onClose }: { onClose: () => void }, ref) => {
    const user = useUserStore((state) => state.user);
    const jobRolesForUserGroup = useGetUserJobRoles(user.clientType);

    const form = useForm<awsbUser>({
      defaultValues: createEmptyawsbUser(),
      resolver: zodResolver(awsbUserFormValidationSchema),
    });

    const submitMutation = useSaveSuperAdminClientMutation({
      onSuccess: () => {
        onClose();
        form.reset();
      },
    });

    useImperativeHandle(ref, () => ({
      submit: () => {
        form.handleSubmit((data: awsbUser) => {
          submitMutation.mutate(data);
        })();
      },
      reset: () => {
        form.reset();
      },
    }));

    return (
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit((data) => submitMutation.mutate(data))();
        }}
      >
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
          placeholder="Select organisation name"
          options={[
            { id: "1", value: "Org 1" },
            { id: "2", value: "Org 2" },
          ]}
        />
      </form>
    );
  },
);

AddUserForm.displayName = "AddUserForm";
