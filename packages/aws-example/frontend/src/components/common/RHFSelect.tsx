import {
  Controller,
  FieldPath,
  FieldValues,
  PathValue,
  UseFormReturn,
} from "react-hook-form";
import { AWSESelect, AWSESelectProps } from "./AWSESelect";

type RHFSelectProps<
  TValues extends FieldValues,
  TPath extends FieldPath<TValues>,
> = Omit<AWSESelectProps, "value" | "isError" | "helperText"> & {
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
    ...awseSelectProps
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
          <AWSESelect
            value={field.value}
            isError={!!fieldState.error}
            helperText={fieldState.error?.message}
            id={awseSelectProps.id ?? fieldPath}
            testId={awseSelectProps.testId ?? fieldPath}
            {...awseSelectProps}
            onChange={(v) => {
              field.onChange(v);
              awseSelectProps?.onChange?.(v);
            }}
          />
        );
      }}
    />
  );
}
