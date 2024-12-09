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
      render={({ field, fieldState }) => {
        return (
          <CWLTextField
            isError={!!fieldState.error}
            helperText={fieldState.error?.message}
            value={field.value ?? ""}
            onClear={
              !isClearable
                ? undefined
                : () => {
                    field.onChange("");
                  }
            }
            {...cwlTextFieldProps}
            id={cwlTextFieldProps.id ?? fieldPath}
            testId={cwlTextFieldProps.testId ?? fieldPath}
            onChange={(e, newValue) => {
              field.onChange(newValue);
              cwlTextFieldProps.onChange?.(e, newValue);
            }}
          />
        );
      }}
    />
  );
}
