import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

export const CWLOrgSchema = z.object({
  organizatiionId: z.string().default(() => uuidv4()),
  organizationName: z.string().min(1, "Organisation name is required"),
  addressLine1: z.string().min(1, "Address line 1 is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  country: z.string().min(1, "Country is required"),
  postalCode: z.string().min(1, "Postal code is required"),
  orgPhone: z.string().optional(),
});

export type CWLOrgInput = z.infer<typeof CWLOrgSchema>;

export const createEmptyCWLOrg = (): CWLOrgInput => ({
  organizatiionId: uuidv4(),
  organizationName: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  country: "",
  postalCode: "",
  orgPhone: "",
});