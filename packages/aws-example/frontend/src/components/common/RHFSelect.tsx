import {
  Controller,
  FieldPath,
  FieldValues,
  PathValue,
  UseFormReturn,
} from "react-hook-form";
import { AWSBSelect, AWSBSelectProps } from "./AWSBSelect";

type RHFSelectProps<
  TValues extends FieldValues,
  TPath extends FieldPath<TValues>,
> = Omit<AWSBSelectProps, "value" | "isError" | "helperText"> & {
  form: UseFormReturn<TValues>;
  fieldPath: TPath;
  requiredMessage?: string;
  customValidation?: (
    fieldValue: PathValue<TValues, TPath>,
  ) => string | boolean | undefined;
};

export function RHFSelect<
  TValues extends FieldValues,
  TPath extends FieldPath<TValues> = FieldPath<TValues>,
>(props: RHFSelectProps<TValues, TPath>) {
  const {
    form,
    fieldPath,
    requiredMessage,
    customValidation,
    ...awsbSelectProps
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
          <AWSBSelect
            value={field.value}
            isError={!!fieldState.error}
            helperText={fieldState.error?.message}
            id={awsbSelectProps.id ?? fieldPath}
            testId={awsbSelectProps.testId ?? fieldPath}
            {...awsbSelectProps}
            onChange={(v) => {
              field.onChange(v);
              awsbSelectProps?.onChange?.(v);
            }}
          />
        );
      }}
    />
  );
}
