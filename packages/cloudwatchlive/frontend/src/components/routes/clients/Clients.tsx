"use client";

import React, { useRef, useState } from "react";
import { UseFormReturn } from "react-hook-form";
import {
  CWLClient,
  createEmptySuperAdminClient,
  OrgDetailsSchema,
  ContactDetailsSchema,
} from "shared/types/CWLClient";
import { FormModal, FormStep } from "@/components/common/FormModal";
import { CWLButton } from "@/components/common/CWLButton";
import { useUserStore } from "@/stores/userStore";
import { UserGroup } from "@/graphql/gqlTypes";
import { z } from "zod";
import { useSaveClientMutation } from "./clientHooks";

export const Clients = () => {
  const [showAddNewUserModal, setShowAddNewUserModal] = useState(false);
  const userGroups = useUserStore((state) => state.userGroups);
  const isSuperAdminUser = userGroups.includes("SuperAdmin" as UserGroup);
  const isEventCompanyAdmin = userGroups.includes(
    "EventCompanyAdmin" as UserGroup,
  );

  // Refs for each user type
  const superAdminFormRef =
    useRef<UseFormReturn<Record<string, unknown>>>(null);
  const eventCompanyFormRef =
    useRef<UseFormReturn<Record<string, unknown>>>(null);

  const submitMutation = useSaveClientMutation({
    onSuccess: () => {
      setShowAddNewUserModal(false);
    },
  });

  const onSubmit = () => {
    const formRef = isSuperAdminUser
      ? superAdminFormRef
      : isEventCompanyAdmin
        ? eventCompanyFormRef
        : null;

    if (formRef?.current) {
      formRef.current.handleSubmit((data) => {
        submitMutation.mutate(data as CWLClient);
      }, console.error)();
    }
  };

  // Steps for SuperAdminUser
  const superAdminSteps: FormStep<Record<string, unknown>>[] = [
    {
      id: "org",
      schema: OrgDetailsSchema,
      fields: [
        { name: "orgName", label: "Organisation Name" },
        { name: "addressLine1", label: "Address Line 1" },
        { name: "addressLine2", label: "Address Line 2" },
        { name: "city", label: "City" },
        { name: "state", label: "State" },
        { name: "country", label: "Country" },
        { name: "postalCode", label: "Postal Code" },
      ],
    },
    {
      id: "contacts",
      schema: ContactDetailsSchema,
      fields: [
        { name: "contactName", label: "Contact Name" },
        { name: "contactEmail", label: "Contact Email" },
        { name: "contactPhone", label: "Contact Phone" },
        { name: "contactRole", label: "Contact Role" },
      ],
    },
  ];

  // Steps for EventCompanyAdmin
  const eventCompanySteps: FormStep<Record<string, unknown>>[] = [
    {
      id: "eventCompanyDetails",
      schema: z.object({
        companyName: z.string().nonempty("Company Name is required"),
        contactNumber: z.string().nonempty("Contact Number is required"),
      }),
      fields: [
        { name: "companyName", label: "Company Name" },
        { name: "contactNumber", label: "Contact Number" },
      ],
    },
    {
      id: "eventDetails",
      schema: z.object({
        eventName: z.string().nonempty("Event Name is required"),
        eventDate: z.string().nonempty("Event Date is required"),
      }),
      fields: [
        { name: "eventName", label: "Event Name" },
        { name: "eventDate", label: "Event Date" },
      ],
    },
  ];

  // Determine which form to render
  const formRef = isSuperAdminUser
    ? superAdminFormRef
    : isEventCompanyAdmin
      ? eventCompanyFormRef
      : null;

  const steps = isSuperAdminUser
    ? superAdminSteps
    : isEventCompanyAdmin
      ? eventCompanySteps
      : [];

  const initialValues = isSuperAdminUser
    ? createEmptySuperAdminClient()
    : isEventCompanyAdmin
      ? { companyName: "", contactNumber: "", eventName: "", eventDate: "" }
      : {};

  return (
    <>
      <FormModal
        ref={formRef}
        isOpen={showAddNewUserModal}
        onClose={() => setShowAddNewUserModal(false)}
        initialValues={initialValues}
        steps={steps}
        onSubmit={onSubmit}
        modalTitle={
          isSuperAdminUser ? "Add New Client" : "Add New Event Company"
        }
      />
      <CWLButton
        buttonText="New client"
        onClick={() => setShowAddNewUserModal(true)}
      />
    </>
  );
};
