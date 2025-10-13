import {
  Controller,
  FieldPath,
  FieldValues,
  PathValue,
  UseFormReturn,
} from "react-hook-form";
import { AWSETextField, AWSETextFieldProps } from "./AWSETextField";

export type RHFTextFieldProps<
  TValues extends FieldValues,
  TPath extends FieldPath<TValues>,
> = Omit<AWSETextFieldProps, "value" | "onClear" | "isError" | "helperText"> & {
  form: UseFormReturn<TValues>;
  fieldPath: TPath;
  isClearable?: boolean;
  requiredMessage?: string;
  customClassName?: string;
  customValidation?: (
    fieldValue: PathValue<TValues, TPath>,
  ) => string | boolean | undefined;
};

export function RHFTextField<
  TValues extends FieldValues,
  TPath extends FieldPath<TValues>,
>(props: RHFTextFieldProps<TValues, TPath>) {
  const {
    form,
    fieldPath,
    isClearable,
    requiredMessage,
    customValidation,
    customClassName,
    ...awseTextFieldProps
  } = props;

  return (
    <Controller
      control={form.control}
      name={fieldPath}
      rules={{
        required: requiredMessage,
        validate: customValidation,
      }}
      render={({ field, fieldState }) => (
        <AWSETextField
          helperText={fieldState.error?.message || ""}
          isError={!!fieldState.error}
          value={field.value ?? ""}
          onClear={isClearable ? () => field.onChange("") : undefined}
          {...awseTextFieldProps}
          id={awseTextFieldProps.id ?? fieldPath}
          testId={awseTextFieldProps.testId ?? fieldPath}
          onChange={(e, newValue) => {
            field.onChange(newValue);
            form.clearErrors(fieldPath); // Clear the error for this field
            awseTextFieldProps.onChange?.(e, newValue);
          }}
          customClassName={customClassName}
        />
      )}
    />
  );
}
