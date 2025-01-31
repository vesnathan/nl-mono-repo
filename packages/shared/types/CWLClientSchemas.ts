import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

// Section-specific schemas for SuperAdmin Clients
export const OrgDetailsSchema = z.object({
  orgName: z.string().min(1, "Organisation name is required"),
  addressLine1: z.string().min(1, "Address line 1 is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  country: z.string().min(1, "Country is required"),
  postalCode: z.string().min(1, "Postal code is required"),
});

export const ContactDetailsSchema = z.object({
  contactName: z.string().min(1, "Contact name is required"),
  contactEmail: z.string().min(1, "Contact email is required"),
  contactPhone: z.string().min(1, "Contact phone is required"),
  contactRole: z.string().min(1, "Contact role is required"),
});

// Schema for SuperAdmin Clients
export const Client_CWLClientSchema = OrgDetailsSchema.merge(ContactDetailsSchema).extend({
  id: z.string().default(() => uuidv4()),
  createdDate: z.string().default(() => new Date().toISOString()),
  createdBy: z.string(),
  addressLine2: z.string().optional(),
});

export type Client_CWLClient = z.infer<typeof Client_CWLClientSchema>;

// Utility function to create an empty SuperAdmin Client
export const createEmptySuperAdminClient = (): Client_CWLClient => {
  return {
    id: uuidv4(),
    orgName: "",
    createdDate: new Date().toISOString(),
    createdBy: "69be4448-e0e1-70e6-5213-064579ca4b72",
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
  };
};

// Validation schema for SuperAdmin Add Client form
export const SuperAdminAddClientFormValidationSchema = Client_CWLClientSchema.superRefine(
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

// **Schema for EventCompanyAdmin Clients** (Only Four Fields)
export const EventCompanyClientSchema = z.object({
  id: z.string().default(() => uuidv4()),
  createdDate: z.string().default(() => new Date().toISOString()),
  createdBy: z.string(),
  companyName: z.string().min(1, "Company Name is required"),
  contactNumber: z.string().min(1, "Contact Number is required"),
  eventName: z.string().min(1, "Event Name is required"),
  eventDate: z.string().min(1, "Event Date is required"),
});

export type EventCompanyClient = z.infer<typeof EventCompanyClientSchema>;

// Utility function to create an empty Event Company Client
export const createEmptyEventCompanyClient = (): EventCompanyClient => {
  return {
    id: uuidv4(),
    createdDate: new Date().toISOString(),
    createdBy: "69be4448-e0e1-70e6-5213-064579ca4b72",
    companyName: "",
    contactNumber: "",
    eventName: "",
    eventDate: "",
  };
};

// **Unified Schema** for all client types
export const CWLClientSchema = z.union([Client_CWLClientSchema, EventCompanyClientSchema]);

export type CWLClient = z.infer<typeof CWLClientSchema>;
