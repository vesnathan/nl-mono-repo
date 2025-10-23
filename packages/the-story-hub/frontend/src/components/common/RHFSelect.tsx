import {
  Controller,
  FieldPath,
  FieldValues,
  PathValue,
  UseFormReturn,
} from "react-hook-form";
import { CustomSelect, CustomSelectPropsType } from "./CustomSelect";

type RHFSelectProps<
  TValues extends FieldValues,
  TPath extends FieldPath<TValues>,
> = Omit<CustomSelectPropsType, "value" | "isError" | "helperText"> & {
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
    ...CustomSelectProps
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
          <CustomSelect
            value={field.value}
            isError={!!fieldState.error}
            helperText={fieldState.error?.message}
            id={CustomSelectProps.id ?? fieldPath}
            testId={CustomSelectProps.testId ?? fieldPath}
            {...CustomSelectProps}
            onChange={(v) => {
              field.onChange(v);
              CustomSelectProps?.onChange?.(v);
            }}
          />
        );
      }}
    />
  );
}
