import {
  Controller,
  FieldPath,
  FieldValues,
  PathValue,
  UseFormReturn,
} from "react-hook-form";
import { AWSBTextField, AWSBTextFieldProps } from "./AWSBTextField";

export type RHFTextFieldProps<
  TValues extends FieldValues,
  TPath extends FieldPath<TValues>,
> = Omit<AWSBTextFieldProps, "value" | "onClear" | "isError" | "helperText"> & {
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
    ...awsbTextFieldProps
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
        <AWSBTextField
          helperText={fieldState.error?.message || ""}
          isError={!!fieldState.error}
          value={field.value ?? ""}
          onClear={isClearable ? () => field.onChange("") : undefined}
          {...awsbTextFieldProps}
          id={awsbTextFieldProps.id ?? fieldPath}
          testId={awsbTextFieldProps.testId ?? fieldPath}
          onChange={(e, newValue) => {
            field.onChange(newValue);
            form.clearErrors(fieldPath); // Clear the error for this field
            awsbTextFieldProps.onChange?.(e, newValue);
          }}
          customClassName={customClassName}
        />
      )}
    />
  );
}
