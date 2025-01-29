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
  const eventCompanyAdminFormRef =
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
        ? eventCompanyAdminFormRef
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
        {
          name: "orgName",
          label: "Organisation Name",
          colSpan: "1",
          type: "text",
        },
        {
          name: "addressLine1",
          label: "Address Line 1",
          colSpan: "1",
          type: "text",
        },
        {
          name: "addressLine2",
          label: "Address Line 2",
          colSpan: "1",
          type: "text",
        },
        {
          name: "city",
          label: "City",
          colSpan: "2",
          type: "text",
        },
        {
          name: "state",
          label: "State",
          type: "text",
          colSpan: "2",
        },
        {
          name: "country",
          label: "Country",
          type: "text",
          colSpan: "2",
        },
        {
          name: "postalCode",
          label: "Postal Code",
          type: "text",
          colSpan: "2",
        },
      ],
    },
    {
      id: "contacts",
      schema: ContactDetailsSchema,
      fields: [
        { name: "contactName", label: "Contact Name", type: "text" },
        { name: "contactEmail", label: "Contact Email", type: "text" },
        { name: "contactPhone", label: "Contact Phone", type: "text" },
        { name: "contactRole", label: "Contact Role", type: "text" },
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
        { name: "companyName", label: "Company Name", type: "text" },
        { name: "contactNumber", label: "Contact Number", type: "text" },
      ],
    },
    {
      id: "eventDetails",
      schema: z.object({
        eventName: z.string().nonempty("Event Name is required"),
        eventDate: z.string().nonempty("Event Date is required"),
      }),
      fields: [
        { name: "eventName", label: "Event Name", type: "text" },
        { name: "eventDate", label: "Event Date", type: "text" },
      ],
    },
  ];

  // Determine which form to render
  const formRef = isSuperAdminUser
    ? superAdminFormRef
    : isEventCompanyAdmin
      ? eventCompanyAdminFormRef
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
