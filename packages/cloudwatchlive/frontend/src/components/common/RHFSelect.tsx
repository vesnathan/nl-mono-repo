import {
  Controller,
  FieldPath,
  FieldValues,
  PathValue,
  UseFormReturn,
} from "react-hook-form";
import { CWLTextField, CWLTextFieldProps } from "./CWLTextField";

export type RHFTextFieldProps<
  TValues extends FieldValues,
  TPath extends FieldPath<TValues>,
> = Omit<CWLTextFieldProps, "value" | "onClear" | "isError" | "helperText"> & {
  form: UseFormReturn<TValues>;
  fieldPath: TPath;
  isClearable?: boolean;
  requiredMessage?: string;
  customClassName?: string;
  customValidation?: (
    fieldValue: PathValue<TValues, TPath>,
  ) => string | boolean | undefined;
};

export function RHFSelect<
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
    ...cwlTextFieldProps
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
        <CWLTextField
          helperText={fieldState.error?.message || ""}
          isError={!!fieldState.error}
          value={field.value ?? ""}
          onClear={isClearable ? () => field.onChange("") : undefined}
          {...cwlTextFieldProps}
          id={cwlTextFieldProps.id ?? fieldPath}
          testId={cwlTextFieldProps.testId ?? fieldPath}
          onChange={(e, newValue) => {
            field.onChange(newValue);
            form.clearErrors(fieldPath); // Clear the error for this field
            cwlTextFieldProps.onChange?.(e, newValue);
          }}
          customClassName={customClassName}
        />
      )}
    />
  );
}
