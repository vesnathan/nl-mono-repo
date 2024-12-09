import {
  forwardRef,
  useImperativeHandle,
  useState,
  useEffect,
  useRef,
} from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import {
  Client_CWLClient,
  ContactDetailsSchema,
  createEmptySuperAdminClient,
  CWLClient,
  OrgDetailsSchema,
  SuperAdminAddClientFormValidationSchema,
} from "shared/types/CWLClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { RHFTextField } from "@/components/common/RHFTextfield";
import { motion, AnimatePresence } from "framer-motion";

export type SuperAdminAddClientFormRefType = {
  form: UseFormReturn<CWLClient>;
};

const SuperAdminAddClientFormComponent = (
  props: object,
  ref: React.ForwardedRef<SuperAdminAddClientFormRefType>,
) => {
  //
  const form: UseFormReturn<Client_CWLClient> = useForm<Client_CWLClient>({
    defaultValues: createEmptySuperAdminClient(),
    resolver: zodResolver(SuperAdminAddClientFormValidationSchema),
  });

  const [expanded, setExpanded] = useState<string>("org");
  const containerRef = useRef<HTMLDivElement>(null);

  const watchedValues = form.watch();

  useEffect(() => {
    if (containerRef.current) {
      const maxHeight = Array.from(containerRef.current.children).reduce(
        (max, child) => {
          const childHeight = (child as HTMLElement).scrollHeight;
          return Math.max(max, childHeight);
        },
        0,
      );
      containerRef.current.style.height = `${maxHeight + 50}px`;
    }
  }, [expanded]);

  const isSectionComplete = (sectionId: string): boolean => {
    if (sectionId === "org") {
      return OrgDetailsSchema.safeParse(watchedValues).success;
    }

    if (sectionId === "contacts") {
      return ContactDetailsSchema.safeParse(watchedValues).success;
    }

    return false;
  };

  const handleBlurForTransition = () => {
    if (expanded === "org" && isSectionComplete("org")) {
      setExpanded("contacts");
    }
  };

  const getStepStatus = (stepId: string) => {
    if (isSectionComplete(stepId)) {
      return "completed";
    }

    const currentIndex = steps.findIndex((step) => step.id === expanded);
    const stepIndex = steps.findIndex((step) => step.id === stepId);

    if (stepIndex === currentIndex) {
      return "current";
    }

    return "pending";
  };

  const sectionVariants = {
    hidden: {
      opacity: 0,
      x: "100%",
    },
    visible: {
      opacity: 1,
      x: "0%",
      transition: { type: "spring", stiffness: 300, damping: 30 },
    },
    exit: {
      opacity: 0,
      x: "-100%",
      transition: { type: "spring", stiffness: 300, damping: 30 },
    },
  };

  useImperativeHandle(ref, () => ({
    form,
  }));

  const steps = [
    { id: "org", label: "Organisation Details" },
    { id: "contacts", label: "Contact Details" },
  ];

  return (
    <div
      className="relative w-full bg-white rounded-lg overflow-hidden"
      ref={containerRef}
    >
      {/* Progress Bar */}
      <div className="flex items-center justify-center gap-4 px-4 pt-4 mb-4">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div
              className={`w-8 h-8 flex items-center justify-center rounded-full ${
                getStepStatus(step.id) === "completed"
                  ? "bg-blue-500 text-white"
                  : getStepStatus(step.id) === "current"
                    ? "border-2 border-blue-500 text-blue-500"
                    : "border-2 border-gray-300 text-gray-500"
              }`}
            >
              {index + 1}
            </div>
            {index < steps.length - 1 && (
              <div className="flex-1 border-t-2 border-dotted border-gray-300 mx-2" />
            )}
          </div>
        ))}
      </div>

      {/* Animated Sections */}
      <AnimatePresence initial={false}>
        {expanded === "org" && (
          <motion.div
            key="org"
            className="absolute top-[50px] inset-0 p-4 flex flex-col gap-4"
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            data-expanded="org"
          >
            <RHFTextField
              form={form}
              fieldPath="orgName"
              label="Organisation name:"
              placeholder="Please enter the organisation name"
              onBlur={handleBlurForTransition}
            />
            <RHFTextField
              form={form}
              fieldPath="addressLine1"
              label="Address line 1:"
              placeholder="Please enter the organisation's address"
              onBlur={handleBlurForTransition}
            />
            <RHFTextField
              form={form}
              fieldPath="addressLine2"
              label="Address line 2:"
              onBlur={handleBlurForTransition}
            />
            <div className="grid grid-cols-2 gap-4">
              <RHFTextField
                form={form}
                fieldPath="city"
                label="City:"
                placeholder="Please enter the organisation's city"
                onBlur={handleBlurForTransition}
              />
              <RHFTextField
                form={form}
                fieldPath="state"
                label="State:"
                placeholder="Please enter the organisation's state"
                onBlur={handleBlurForTransition}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <RHFTextField
                form={form}
                fieldPath="country"
                label="Country:"
                placeholder="Please enter the organisation's country"
                onBlur={handleBlurForTransition}
              />
              <RHFTextField
                form={form}
                fieldPath="postalCode"
                label="Postal code:"
                placeholder="Please enter the organisation's postal code"
                onBlur={handleBlurForTransition}
              />
            </div>
          </motion.div>
        )}

        {expanded === "contacts" && (
          <motion.div
            key="contacts"
            className="absolute top-[50px] inset-0 p-4 flex flex-col gap-4"
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            data-expanded="contacts"
          >
            <RHFTextField
              form={form}
              fieldPath="contactName"
              label="Contact name:"
              placeholder="Please enter the contact name"
              onBlur={handleBlurForTransition}
            />
            <RHFTextField
              form={form}
              fieldPath="contactEmail"
              label="Contact email:"
              placeholder="Please enter the contact email"
              onBlur={handleBlurForTransition}
            />
            <RHFTextField
              form={form}
              fieldPath="contactPhone"
              label="Contact phone:"
              placeholder="Please enter the contact phone"
              onBlur={handleBlurForTransition}
            />
            <RHFTextField
              form={form}
              fieldPath="contactRole"
              label="Contact role:"
              placeholder="Please enter the contact role"
              onBlur={handleBlurForTransition}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const SuperAdminAddClientForm = forwardRef(
  SuperAdminAddClientFormComponent,
);
