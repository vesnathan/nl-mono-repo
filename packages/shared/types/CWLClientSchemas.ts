/// CWLClientSchemas.ts
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

// ----------------------
// Organization Details Schema (Step 1)
// ----------------------
export const OrgDetailsSchema = z.object({
  clientType: z.literal("SuperAdmin"),
  orgName: z.string().min(1, "Organisation name is required"),
  addressLine1: z.string().min(1, "Address line 1 is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  country: z.string().min(1, "Country is required"),
  postalCode: z.string().min(1, "Postal code is required"),
});

// ----------------------
// Contact Details Schema (Step 2)
// ----------------------
export const ContactDetailsSchema = z.object({
  contactName: z.string().min(1, "Contact name is required"),
  contactEmail: z.string().min(1, "Contact email is required"),
  contactPhone: z.string().min(1, "Contact phone is required"),
  contactRole: z.string().min(1, "Contact role is required"),
});

// ----------------------
// Schemas for each step
// ----------------------
export const SuperAdminStep1Schema = OrgDetailsSchema;
export const SuperAdminStep2Schema = ContactDetailsSchema;

// ----------------------
// Full SuperAdmin Client Schema (for final submission)
// ----------------------
export const Client_CWLSuperAdminClientSchema = OrgDetailsSchema.merge(ContactDetailsSchema);

export type Client_CWLSuperAdminClient = z.infer<
  typeof Client_CWLSuperAdminClientSchema
>;

// Utility function to create an empty SuperAdmin Client
export const createEmptySuperAdminClient = (): Client_CWLSuperAdminClient => ({
  clientType: "SuperAdmin",
  orgName: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  country: "",
  postalCode: "",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  contactRole: "",
});


// Validation schema for SuperAdmin Add Client form
export const SuperAdminAddClientFormValidationSchema = Client_CWLSuperAdminClientSchema.superRefine(
  (val, ctx) => {
    const requiredFields = [
      { field: "orgName", message: "Please enter the name of the organisation" },
      { field: "addressLine1", message: "Please enter the organisation's address" },
      { field: "city", message: "Please enter the organisation's city" },
      { field: "state", message: "Please enter the organisation's state" },
      { field: "country", message: "Please enter the organisation's country" },
      { field: "postalCode", message: "Please enter the organisation's postal code" },
      { field: "contactName", message: "Please enter the contact's name" },
      { field: "contactEmail", message: "Please enter the contact's email" },
      { field: "contactPhone", message: "Please enter the contact's phone number" },
      { field: "contactRole", message: "Please enter the contact's role" },
    ];

    requiredFields.forEach(({ field, message }) => {
      if (!val[field as keyof typeof val]) {
        ctx.addIssue({
          path: [field],
          message,
          code: z.ZodIssueCode.custom,
        });
      }
    });
  }
);

// ----------------------
// EventCompanyAdmin Client Schemas
// ----------------------

// EventCompanyAdmin Client Schema
export const EventCompanyClientSchema = z.object({
  orgId: z.string().default(() => uuidv4()),
  contactId: z.string().default(() => uuidv4()),
  clientType: z.literal("EventCompanyAdmin"),
  createdDate: z.string().default(() => new Date().toISOString()),
  createdBy: z.string(),
  orgName: z.string().min(1, "Organisation name is required"),
  addressLine1: z.string().min(1, "Address line 1 is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  country: z.string().min(1, "Country is required"),
  postalCode: z.string().min(1, "Postal code is required"),
  addressLine2: z.string().optional(),
  contactName: z.string().min(1, "Contact name is required"),
  contactEmail: z.string().min(1, "Contact email is required"),
  contactPhone: z.string().min(1, "Contact phone is required"),
  contactRole: z.string().min(1, "Contact role is required"),
});

export type EventCompanyClient = z.infer<typeof EventCompanyClientSchema>;

// Utility function to create an empty Event Company Client
export const createEmptyEventCompanyClient = (): EventCompanyClient => ({
  orgId: uuidv4(),
  contactId: uuidv4(),
  clientType: "EventCompanyAdmin",
  createdDate: new Date().toISOString(),
  createdBy: "69be4448-e0e1-70e6-5213-064579ca4b72",
  orgName: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  country: "",
  postalCode: "",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  contactRole: "",
});

// ----------------------
// Unified Schema for All Client Types (Discriminated Union)
// ----------------------

export const CWLClientSchema = z.discriminatedUnion("clientType", [
  Client_CWLSuperAdminClientSchema,
  EventCompanyClientSchema,
]);

export type CWLClient = z.infer<typeof CWLClientSchema>;
