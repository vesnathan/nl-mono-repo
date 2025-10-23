import {
  Controller,
  FieldPath,
  FieldValues,
  PathValue,
  UseFormReturn,
} from "react-hook-form";
import { CustomTextField, CustomTextFieldProps } from "./CustomTextField";

export type RHFTextFieldProps<
  TValues extends FieldValues,
  TPath extends FieldPath<TValues>,
> = Omit<
  CustomTextFieldProps,
  "value" | "onClear" | "isError" | "helperText"
> & {
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
    ...TextFieldProps
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
        <CustomTextField
          helperText={fieldState.error?.message || ""}
          isError={!!fieldState.error}
          value={field.value ?? ""}
          onClear={isClearable ? () => field.onChange("") : undefined}
          {...TextFieldProps}
          id={TextFieldProps.id ?? fieldPath}
          testId={TextFieldProps.testId ?? fieldPath}
          onChange={(e, newValue) => {
            field.onChange(newValue);
            form.clearErrors(fieldPath); // Clear the error for this field
            TextFieldProps.onChange?.(e, newValue);
          }}
          customClassName={customClassName}
        />
      )}
    />
  );
}
