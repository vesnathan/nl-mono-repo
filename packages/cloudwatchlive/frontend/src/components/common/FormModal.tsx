import {
  forwardRef,
  useImperativeHandle,
  useState,
  useEffect,
  useRef,
} from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { z, ZodObject, ZodTypeAny } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { RHFTextField } from "@/components/common/RHFTextfield";
import { motion, AnimatePresence } from "framer-motion";

export type FormStep = {
  id: string;
  label: string;
  schema: ZodObject<any>;
  fields: {
    name: string;
    label: string;
    placeholder?: string;
    type?: string;
  }[];
};

export type FormModalProps<T> = {
  initialValues: T;
  steps: FormStep[];
  onSubmit: (data: T) => void;
};

export const FormModal = forwardRef(
  <T extends Record<string, ZodTypeAny>>(
    { initialValues, steps, onSubmit }: FormModalProps<T>,
    ref: React.ForwardedRef<UseFormReturn<T>>,
  ) => {
    const [expanded, setExpanded] = useState<string>(steps[0].id);
    const containerRef = useRef<HTMLDivElement>(null);

    const schema = z.object(
      steps.reduce((acc, step) => ({ ...acc, ...step.schema.shape }), {}),
    );

    const form = useForm<T>({
      defaultValues: initialValues,
      resolver: zodResolver(schema),
    });

    const watchedValues = form.watch();

    useImperativeHandle(ref, () => form);

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

    const isStepComplete = (stepId: string): boolean => {
      const step = steps.find((s) => s.id === stepId);
      if (!step) return false;
      return step.schema.safeParse(watchedValues).success;
    };

    const handleBlurForTransition = () => {
      const currentIndex = steps.findIndex((step) => step.id === expanded);
      if (currentIndex >= 0 && isStepComplete(steps[currentIndex].id)) {
        const nextStep = steps[currentIndex + 1];
        if (nextStep) {
          setExpanded(nextStep.id);
        }
      }
    };

    const getStepStatus = (stepId: string) => {
      if (isStepComplete(stepId)) {
        return "completed";
      }

      const currentIndex = steps.findIndex((step) => step.id === expanded);
      const stepIndex = steps.findIndex((step) => step.id === stepId);

      if (stepIndex === currentIndex) {
        return "current";
      }

      return "pending";
    };

    const handleSubmit = form.handleSubmit((data) => {
      onSubmit(data);
    });

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
          {steps.map(
            (step) =>
              expanded === step.id && (
                <motion.div
                  key={step.id}
                  className="absolute top-[50px] inset-0 p-4 flex flex-col gap-4"
                  variants={sectionVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  data-expanded={step.id}
                >
                  {step.fields.map((field) => (
                    <RHFTextField
                      key={field.name}
                      form={form}
                      fieldPath={field.name}
                      label={field.label}
                      placeholder={field.placeholder}
                      onBlur={handleBlurForTransition}
                    />
                  ))}
                </motion.div>
              ),
          )}
        </AnimatePresence>

        {/* Submit Button */}
        <div className="flex justify-end gap-4 p-4">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={form.reset}
          >
            Reset
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSubmit}
          >
            Submit
          </button>
        </div>
      </div>
    );
  },
);
