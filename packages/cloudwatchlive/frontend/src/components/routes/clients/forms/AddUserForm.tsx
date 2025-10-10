"use client";

import { listOrganizationsQueryFn } from "@/graphql/queries/orgQueries";

import React, {
  forwardRef,
  useImperativeHandle,
  useEffect,
  useState,
} from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { RHFSelect } from "@/components/common/RHFSelect";
import { RHFTextField } from "@/components/common/RHFTextfield";

import {
  createEmptyCWLUser,
  CWLUserFormValidationSchema,
} from "@/types/CWLUserSchemas";
import { CWLUser } from "@/types/gqlTypes";
import { useUserStore } from "@/stores/userStore";
import { useGetUserJobRoles } from "@/hooks/useGetUserJobRoles";

import { useSaveSuperAdminClientMutation } from "../clientHooks";
/* eslint-disable sonarjs/cognitive-complexity */

export const AddUserForm = forwardRef(
  ({ onClose }: { onClose: () => void }, ref) => {
    const user = useUserStore((state) => state.user);
    const jobRolesForUserGroup = useGetUserJobRoles(user.clientType);
    const [orgOptions, setOrgOptions] = useState<
      { id: string; value: string }[]
    >([]);
    const form = useForm<CWLUser>({
      defaultValues: createEmptyCWLUser(),
      resolver: zodResolver(CWLUserFormValidationSchema),
    });

    useEffect(() => {
      listOrganizationsQueryFn().then((result) => {
        const orgs = (result.data?.listOrganizations || []) as Array<{
          organizationId: string;
          organizationName: string;
        }>;
        setOrgOptions(
          orgs.map((org) => ({
            id: org.organizationId,
            value: org.organizationName,
          })),
        );
      });
    }, []);

    const submitMutation = useSaveSuperAdminClientMutation({
      onSuccess: () => {
        onClose();
        form.reset();
      },
    });

    useImperativeHandle(ref, () => ({
      submit: () => {
        form.handleSubmit((data: CWLUser) => {
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
          options={orgOptions}
        />
      </form>
    );
  },
);

AddUserForm.displayName = "AddUserForm";
