import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { awsbUserInput } from "@/types/gqlTypes";
import {
  Input,
  ModalBody,
  ModalFooter,
  Select,
  SelectItem,
  Checkbox,
} from "@nextui-org/react";
import { awsbButton } from "@/components/common/awsbButton";
import { createawsbUserMutationFn } from "@/graphql/mutations/userMutations"; // Import the mutation function
import { useMutation } from "@tanstack/react-query"; // Assuming TanStack Query is used
import {
  SALUTATIONS,
  SalutationValue,
} from "@/../shared/constants/salutations";
import { awsb_CLIENT_TYPES } from "@/../../../aws-example/backend/constants/ClientTypes";
import { useSetGlobalMessage } from "@/components/common/GlobalMessage";

// Define the Zod schema for form validation
const createUserSchema = z.object({
  userEmail: z.string().email({ message: "Invalid email address" }),
  userFirstName: z.string().min(1, { message: "First name is required" }),
  userLastName: z.string().min(1, { message: "Last name is required" }),
  userTitle: z.custom<SalutationValue>().optional(),
  userPhone: z.string().optional(),
  organizationId: z.string().min(1, { message: "Organization ID is required" }),
  userRole: z.string().min(1, { message: "User role is required" }),
  sendWelcomeEmail: z.boolean().optional(),
  // clientType: z.array(z.nativeEnum(ClientType)).min(1, { message: 'Client type is required' })
});

type CreateUserFormData = z.infer<typeof createUserSchema>;

interface CreateUserFormProps {
  onClose: () => void;
  onSubmitSuccess: () => void;
}

const BORDER_CLASSES =
  "border border-gray-300 hover:border-gray-400 focus-within:border-blue-500";

export const CreateUserForm: React.FC<CreateUserFormProps> = ({
  onClose,
  onSubmitSuccess,
}) => {
  const setGlobalMessage = useSetGlobalMessage();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: CreateUserFormData) => {
      // Map form data to awsbUserInput
      const input: awsbUserInput = {
        userEmail: data.userEmail,
        userFirstName: data.userFirstName,
        userLastName: data.userLastName,
        userTitle: data.userTitle || "",
        userPhone: data.userPhone || "",
        organizationId: data.organizationId,
        userRole: data.userRole,
        ...(data.sendWelcomeEmail && {
          sendWelcomeEmail: data.sendWelcomeEmail,
        }),
      };
      return createawsbUserMutationFn(input);
    },
    onSuccess: () => {
      setGlobalMessage({
        color: "success",
        content: "User created successfully!",
      });
      onSubmitSuccess();
    },
    onError: (error: unknown) => {
      console.error("Full error object:", error);
      console.error("Error type:", typeof error);

      // Handle different types of errors
      let errorMessage = "Unknown error occurred";

      if (error && typeof error === "object") {
        const err = error as Record<string, unknown>;
        if (err.message && typeof err.message === "string") {
          errorMessage = err.message;
        } else if (
          err.errors &&
          Array.isArray(err.errors) &&
          err.errors.length > 0 &&
          typeof err.errors[0] === "object" &&
          err.errors[0] !== null &&
          "message" in err.errors[0]
        ) {
          errorMessage =
            String((err.errors[0] as Record<string, unknown>).message) ||
            "GraphQL error occurred";
        }
      } else if (typeof error === "string") {
        errorMessage = error;
      }

      setGlobalMessage({
        color: "error",
        content: `Error creating user: ${errorMessage}`,
      });
    },
  });

  const processForm = (data: CreateUserFormData) => {
    createUserMutation.mutate(data);
  };

  // Example organization IDs - replace with actual data fetching or props
  const organizations = [
    { id: "org1", name: "Organization 1" },
    { id: "org2", name: "Organization 2" },
  ];

  return (
    <form onSubmit={handleSubmit(processForm)}>
      <ModalBody>
        <Input
          {...register("userEmail")}
          placeholder="Email"
          errorMessage={errors.userEmail?.message}
          isInvalid={!!errors.userEmail}
          classNames={{
            inputWrapper: BORDER_CLASSES,
          }}
        />
        <Input
          {...register("userFirstName")}
          placeholder="First Name"
          errorMessage={errors.userFirstName?.message}
          isInvalid={!!errors.userFirstName}
          classNames={{
            inputWrapper: BORDER_CLASSES,
          }}
        />
        <Input
          {...register("userLastName")}
          placeholder="Last Name"
          errorMessage={errors.userLastName?.message}
          isInvalid={!!errors.userLastName}
          classNames={{
            inputWrapper: BORDER_CLASSES,
          }}
        />
        <Select
          {...register("userTitle")}
          placeholder="Title (Optional)"
          aria-label="Select Title"
          classNames={{
            trigger: BORDER_CLASSES,
          }}
        >
          {SALUTATIONS.map((salutation) => (
            <SelectItem key={salutation.id} value={salutation.value}>
              {salutation.value}
            </SelectItem>
          ))}
        </Select>
        <Input
          {...register("userPhone")}
          placeholder="Phone (Optional)"
          classNames={{
            inputWrapper: BORDER_CLASSES,
          }}
        />
        <Select
          placeholder="Organization"
          aria-label="Select Organization"
          {...register("organizationId")}
          errorMessage={errors.organizationId?.message}
          isInvalid={!!errors.organizationId}
          classNames={{
            trigger: BORDER_CLASSES,
          }}
        >
          {organizations.map((org) => (
            <SelectItem key={org.id} value={org.id}>
              {org.name}
            </SelectItem>
          ))}
        </Select>
        <Select
          {...register("userRole")}
          placeholder="User Type"
          aria-label="Select User Type"
          errorMessage={errors.userRole?.message}
          isInvalid={!!errors.userRole}
          classNames={{
            trigger: BORDER_CLASSES,
          }}
        >
          {awsb_CLIENT_TYPES.map((type) => (
            <SelectItem key={type.value} value={type.value}>
              {type.displayName}
            </SelectItem>
          ))}
        </Select>
        <Checkbox {...register("sendWelcomeEmail")} className="mt-2">
          Send welcome email with login link
        </Checkbox>
      </ModalBody>
      <ModalFooter>
        <awsbButton buttonText="Cancel" color="cancel" onClick={onClose} />
        <awsbButton
          buttonText="Create User"
          color="primary"
          type="submit"
          isLoading={createUserMutation.isPending}
        />
      </ModalFooter>
    </form>
  );
};
