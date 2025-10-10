import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { ClientType, awsbUser } from "./gqlTypes";

export const createEmptyawsbUser = (): awsbUser => ({
  __typename: "awsbUser",
  userId: uuidv4(),
  organizationId: "",
  userEmail: "",
  userTitle: "",
  userFirstName: "",
  userLastName: "",
  userPhone: "",
  userRole: "",
  privacyPolicy: false,
  termsAndConditions: false,
  userAddedById: "",
  userCreated: "",
  clientType: [],
});

export const awsbUserSchema = z.object({
  userId: z.string().default(() => uuidv4()),
  organizationId: z.string().default(() => uuidv4()),
  userEmail: z.string().min(1, "Contact email is required"),
  userTitle: z.string().optional(),
  userFirstName: z.string().min(1, "Contact first name is required"),
  userLastName: z.string().min(1, "Contact last name is required"),
  userPhone: z.string().min(1, "Contact phone number is required"),
  userRole: z.string().min(1, "Contact role is required"),
  privacyPolicy: z.boolean().default(false),
  termsAndConditions: z.boolean().default(false),
  userAddedById: z.string().min(1, "User added by ID is required"),
  userCreated: z.string().min(1, "User created date is required"),
  clientType: z.array(
    z.enum(Object.values(ClientType) as [string, ...string[]]),
  ),
});

export const awsbUserFormValidationSchema = awsbUserSchema.superRefine(
  (val, ctx) => {
    const requiredFields = [
      {
        field: "userTitle",
        message: "Please select the contact's title",
      },
      {
        field: "userFirstName",
        message: "Please enter the contact's first name",
      },
      {
        field: "userLastName",
        message: "Please enter the contact's last name",
      },
      { field: "userEmail", message: "Please enter the contact's email" },
      {
        field: "userPhone",
        message: "Please enter the contact's phone number",
      },
      { field: "userRole", message: "Please enter the contact's role" },
      {
        field: "organizationId",
        message: "Please select the contact's organization",
      },
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
  },
);
