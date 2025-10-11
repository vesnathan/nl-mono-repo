import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { AWSBUser } from "./gqlTypes";

export const createEmptyAWSBUser = (): AWSBUser => ({
  __typename: "AWSBUser",
  userId: uuidv4(),
  userEmail: "",
  userTitle: "",
  userFirstName: "",
  userLastName: "",
  userPhone: "",
  privacyPolicy: false,
  termsAndConditions: false,
  userAddedById: "",
  userCreated: "",
  clientType: [],
  userProfilePicture: { __typename: "S3Object", Bucket: "", Key: "" },
});

export const AWSBUserSchema = z.object({
  userId: z.string().default(() => uuidv4()),
  userEmail: z.string().min(1, "Contact email is required"),
  userTitle: z.string().optional(),
  userFirstName: z.string().min(1, "Contact first name is required"),
  userLastName: z.string().min(1, "Contact last name is required"),
  userPhone: z.string().min(1, "Contact phone number is required"),
  privacyPolicy: z.boolean().default(false),
  termsAndConditions: z.boolean().default(false),
  userAddedById: z.string().min(1, "User added by ID is required"),
  userCreated: z.string().min(1, "User created date is required"),
});

export const AWSBUserFormValidationSchema = AWSBUserSchema.superRefine(
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
