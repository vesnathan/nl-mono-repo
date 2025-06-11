import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CWLUserInput, ClientType } from '@/graphql/gqlTypes'; // Assuming gqlTypes is correctly aliased
import { Button, Input, ModalBody, ModalFooter, Select, SelectItem } from '@nextui-org/react';

// Define the Zod schema for form validation
// This is based on CWLUserInput, but you might want to adjust it
const createUserSchema = z.object({
  userEmail: z.string().email({ message: 'Invalid email address' }),
  userFirstName: z.string().min(1, { message: 'First name is required' }),
  userLastName: z.string().min(1, { message: 'Last name is required' }),
  userTitle: z.string().optional(),
  userPhone: z.string().optional(),
  organizationId: z.string().min(1, { message: 'Organization ID is required' }), // Or make it optional/fetch
  userRole: z.string().min(1, { message: 'User role is required' }), // This might be an enum or a free text
  // clientType: z.array(z.nativeEnum(ClientType)).min(1, { message: 'Client type is required' }) // If you need to set this on creation
});

type CreateUserFormData = z.infer<typeof createUserSchema>;

interface CreateUserFormProps {
  onClose: () => void;
  onSubmitSuccess: () => void;
}

// Placeholder for the actual mutation hook
const useCreateUserMutation = (options?: { onSuccess?: () => void; onError?: (error: any) => void; }) => {
  // Replace with your actual TanStack Query mutation
  return {
    mutate: (data: CreateUserFormData) => {
      console.log('Simulating create user mutation with:', data);
      // Simulate API call
      setTimeout(() => {
        // const success = Math.random() > 0.2; // Simulate success/failure
        const success = true; // Assume success for now
        if (success) {
          options?.onSuccess?.();
        } else {
          options?.onError?.(new Error('Simulated API error'));
        }
      }, 1000);
    },
    isPending: false, // or isLoading
  };
};


export const CreateUserForm: React.FC<CreateUserFormProps> = ({ onClose, onSubmitSuccess }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    control, // Needed for RHFSelect or NextUI Select with RHF
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
  });

  const createUserMutation = useCreateUserMutation({
    onSuccess: () => {
      console.log('User created successfully (simulated)');
      onSubmitSuccess(); // Close modal and refresh data, etc.
    },
    onError: (error) => {
      console.error('Error creating user (simulated):', error);
      // Handle error display to user
    }
  });

  const processForm = (data: CreateUserFormData) => {
    createUserMutation.mutate(data);
  };

  // Example organization IDs - replace with actual data fetching or props
  const organizations = [
    { id: 'org1', name: 'Organization 1' },
    { id: 'org2', name: 'Organization 2' },
  ];

  // Example user roles - replace with actual data or make it a free text
  const roles = [
    { id: 'role1', name: 'Admin' },
    { id: 'role2', name: 'Editor' },
    { id: 'role3', name: 'Viewer' },
  ];

  return (
    <form onSubmit={handleSubmit(processForm)}>
      <ModalBody>
        <Input
          {...register('userEmail')}
          label="Email"
          placeholder="Enter user's email"
          errorMessage={errors.userEmail?.message}
          isInvalid={!!errors.userEmail}
        />
        <Input
          {...register('userFirstName')}
          label="First Name"
          placeholder="Enter first name"
          errorMessage={errors.userFirstName?.message}
          isInvalid={!!errors.userFirstName}
        />
        <Input
          {...register('userLastName')}
          label="Last Name"
          placeholder="Enter last name"
          errorMessage={errors.userLastName?.message}
          isInvalid={!!errors.userLastName}
        />
        <Input
          {...register('userTitle')}
          label="Title (Optional)"
          placeholder="e.g., Mr, Ms, Dr"
        />
        <Input
          {...register('userPhone')}
          label="Phone (Optional)"
          placeholder="Enter phone number"
        />
        
        {/* Example for Select with NextUI, needs Controller for RHF */}
        {/* For simplicity, using standard RHF register for now if Select doesn't integrate directly */}
        {/* Or use a RHF-compatible Select component if available */}
        <Select
          label="Organization"
          placeholder="Select organization"
          {...register('organizationId')}
          errorMessage={errors.organizationId?.message}
          isInvalid={!!errors.organizationId}
        >
          {organizations.map((org) => (
            <SelectItem key={org.id} value={org.id}>
              {org.name}
            </SelectItem>
          ))}
        </Select>

        <Input
          {...register('userRole')}
          label="User Role"
          placeholder="Enter user role"
          errorMessage={errors.userRole?.message}
          isInvalid={!!errors.userRole}
        />
        {/* 
        // If ClientType needs to be set:
        <Select
          label="Client Type"
          placeholder="Select client type(s)"
          selectionMode="multiple" // if applicable
          {...register('clientType')}
          errorMessage={errors.clientType?.message}
          isInvalid={!!errors.clientType}
        >
          {Object.values(ClientType).map((type) => (
            <SelectItem key={type} value={type}>
              {type}
            </SelectItem>
          ))}
        </Select>
        */}
      </ModalBody>
      <ModalFooter>
        <Button color="danger" variant="light" onPress={onClose}>
          Cancel
        </Button>
        <Button color="primary" type="submit" isLoading={createUserMutation.isPending}>
          Create User
        </Button>
      </ModalFooter>
    </form>
  );
};
