import {
  forwardRef,
  useImperativeHandle,
  useState,
  useRef,
  useEffect,
} from "react";
import {
  useForm,
  UseFormReturn,
  DefaultValues,
  FieldPath,
} from "react-hook-form";
import { z, ZodObject, ZodRawShape } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { RHFTextField } from "@/components/common/RHFTextfield";

export type FormStep<T extends Record<string, unknown>> = {
  id: string;
  schema: ZodObject<ZodRawShape>;
  fields: {
    name: FieldPath<T>;
    label: string;
    placeholder?: string;
    type?: string;
  }[];
};

export type FormModalProps<T extends Record<string, unknown>> = {
  initialValues: DefaultValues<T>;
  steps: FormStep<T>[];
  onSubmit: (data: T) => void;
};

export const FormModal = forwardRef(
  <T extends Record<string, unknown>>(
    { initialValues, steps, onSubmit }: FormModalProps<T>,
    ref: React.ForwardedRef<UseFormReturn<T>>,
  ) => {
    const [currentStep, setCurrentStep] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    const combinedSchema = z.object(
      steps.reduce(
        (acc, step) => ({ ...acc, ...step.schema.shape }),
        {} as ZodRawShape,
      ),
    );

    const form = useForm<T>({
      defaultValues: initialValues,
      resolver: zodResolver(combinedSchema),
    });

    useImperativeHandle(ref, () => form);

    const handleNext = () => {
      if (currentStep < steps.length - 1) {
        setCurrentStep((prev) => prev + 1);
      }
    };

    const handlePrevious = () => {
      if (currentStep > 0) {
        setCurrentStep((prev) => prev - 1);
      }
    };

    const handleSubmit = form.handleSubmit((data) => {
      onSubmit(data);
    });

    useEffect(() => {
      if (containerRef.current) {
        const child = containerRef.current.children[0] as HTMLElement;
        if (child) {
          containerRef.current.style.height = `${child.scrollHeight}px`;
        }
      }
    }, [currentStep]);

    return (
      <div
        className="relative w-full bg-white rounded-lg p-4"
        ref={containerRef}
      >
        {/* Current Step Form */}
        <div>
          {steps[currentStep].fields.map((field) => (
            <RHFTextField
              key={field.name}
              form={form}
              fieldPath={field.name}
              label={field.label}
              placeholder={field.placeholder}
            />
          ))}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-4">
          {currentStep > 0 && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handlePrevious}
            >
              Previous
            </button>
          )}
          {currentStep < steps.length - 1 ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleNext}
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSubmit}
            >
              Submit
            </button>
          )}
        </div>
      </div>
    );
  },
);
