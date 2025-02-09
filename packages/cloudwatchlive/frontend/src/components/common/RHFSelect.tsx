import {
  Controller,
  FieldPath,
  FieldValues,
  PathValue,
  UseFormReturn,
} from "react-hook-form";
import { CWLSelect, CWLSelectProps } from "./CWLSelect";

type RHFSelectProps<
  TValues extends FieldValues,
  TPath extends FieldPath<TValues>,
> = Omit<CWLSelectProps, "value" | "isError" | "helperText"> & {
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
    ...cwlSelectProps
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
          <CWLSelect
            value={field.value}
            isError={!!fieldState.error}
            helperText={fieldState.error?.message}
            id={cwlSelectProps.id ?? fieldPath}
            testId={cwlSelectProps.testId ?? fieldPath}
            {...cwlSelectProps}
            onChange={(v) => {
              field.onChange(v);
              cwlSelectProps?.onChange?.(v);
            }}
          />
        );
      }}
    />
  );
}
