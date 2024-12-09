import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { addRequiredValidation } from "shared/utils/zodUtils";

// Section-specific schemas
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

// Main client schema combining the sections
export const Client_CWLClientSchema = OrgDetailsSchema.merge(ContactDetailsSchema).extend({
  id: z.string().default(() => uuidv4()),
  createdDate: z.string().default(() => new Date().toISOString()),
  createdBy: z.string(),
  addressLine2: z.string().optional(),
});

export type Client_CWLClient = z.infer<typeof Client_CWLClientSchema>;

// Utility function to create an empty client
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
    const addFieldValidation = (field: string, message: string) => {
      if (!val[field as keyof typeof val]) {
        ctx.addIssue({
          path: [field],
          message,
          code: z.ZodIssueCode.custom,
        });
      }
    };

    // Apply required field validation
    addFieldValidation("orgName", "Please enter the name of the organisation");
    addFieldValidation("addressLine1", "Please enter the organisation's address");
    addFieldValidation("city", "Please enter the organisation's city");
    addFieldValidation("state", "Please enter the organisation's state");
    addFieldValidation("country", "Please enter the organisation's country");
    addFieldValidation("postalCode", "Please enter the organisation's postal code");
    addFieldValidation("contactName", "Please enter the contact's name");
    addFieldValidation("contactEmail", "Please enter the contact's email");
    addFieldValidation("contactPhone", "Please enter the contact's phone number");
    addFieldValidation("contactRole", "Please enter the contact's role");
  }
);

// Event company client schema for other types of clients
export const Client_EventCompanyClient = OrgDetailsSchema.merge(ContactDetailsSchema).extend({
  id: z.string().default(() => uuidv4()),
  createdDate: z.string().default(() => new Date().toISOString()),
  createdBy: z.string(),
  addressLine2: z.string().optional(),
});

// Unified schema for all client types
const CWLClientSchema = z.union([Client_CWLClientSchema, Client_EventCompanyClient]);

export type CWLClient = z.infer<typeof CWLClientSchema>;
