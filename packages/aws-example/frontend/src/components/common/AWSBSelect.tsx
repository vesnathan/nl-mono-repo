/* eslint-disable sonarjs/no-duplicate-string */
import { cn, extendVariants, Select, SelectItem } from "@nextui-org/react";
import React, { useId } from "react";
import type { SelectProps } from "@nextui-org/select";
import type { SharedSelection } from "@nextui-org/system";

const triggerClassnames = [
  "min-h-0 h-full",
  "rounded-md border-1 border-neutral-200",
  "bg-white",
  "data-[hover=true]:border-primary-500",
  "data-[hover=true]:bg-white",
  "data-[focus=true]:border-primary-500",
  "data-[open=true]:border-primary-500",
  // due to unable to set same border-error on AWSBTextField,
  // comment this out for consistency
  // "data-[has-error=true]:border-error-500",
  "data-[disabled=true]:bg-neutral-100",
];

const ExtendedNextUISelect = extendVariants(Select, {
  variants: {
    size: {
      sm: {
        trigger: cn(...triggerClassnames, "px3 py-2 h-[38px]"),
        value: "text-body2",
      },
      md: {
        trigger: cn(...triggerClassnames, "px3 py-2.5 h-[40px]"),
        value: "text-body2",
      },
    },
  },
});

export type AWSBSelectOption<T extends string = string> = {
  id: T;
  value: React.ReactNode;
  textValue?: string;
};

export interface AWSBSelectProps<T extends string = string> {
  id?: string;
  testId?: string;

  size?: "sm" | "md";
  label?: React.ReactNode;
  placeholder?: string;

  isError?: boolean;
  helperText?: React.ReactNode;

  options: AWSBSelectOption<T>[];
  value?: T | number | null | undefined;
  onChange?: (value: T | "") => void;
  onFocus?: () => void;

  isDisabled?: boolean;
  isOptional?: boolean;

  // override classNames
  classNames?: {
    root?: string;
    label?: string;
    inputWrapper?: string;
    helperText?: string;

    nextUISelect?: {
      listboxWrapper?: string;
      base?: string;
      mainWrapper?: string;
      trigger?: string;
      innerWrapper?: string;
      selectorIcon?: string;
      value?: string;
      listbox?: string;
      popoverContent?: string;
    };
  };
  isLoading?: boolean;
}

export function AWSBSelect<T extends string>(props: AWSBSelectProps<T>) {
  const {
    id,
    testId,
    label,
    placeholder,
    options,
    value,
    onChange,
    onFocus,
    isError,
    isDisabled,
    isOptional,
    helperText,
    classNames,
    isLoading,
    size = "sm",
  } = props;

  const reactId = useId();
  const inputId = id ?? reactId;

  const inputRef = React.useRef<HTMLSelectElement | null>(null);
  const selectedKeys = React.useMemo<Set<string>>(() => {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return new Set();
    }
    return new Set([`${value}`]);
  }, [value]);

  const ExtendedNextUISelectTyped =
    ExtendedNextUISelect as unknown as React.ComponentType<
      SelectProps<Record<string, unknown>>
    >;

  return (
    <div className={cn("w-full", classNames?.root)}>
      {!!label && (
        <label
          htmlFor={inputId}
          className={cn(
            "text-neutral-900",
            "text-body2",
            "font-semibold",
            classNames?.label,
          )}
        >
          {label}{" "}
          {isOptional && <span className="text-neutral-600">(Optional)</span>}
        </label>
      )}
      <div className={cn("flex flex-col w-full", classNames?.inputWrapper)}>
        <ExtendedNextUISelectTyped
          isLoading={isLoading}
          placeholder={placeholder}
          id={inputId}
          aria-label={!!label && typeof label === "string" ? label : "Select"}
          ref={inputRef}
          data-testid={testId}
          data-has-error={!!isError}
          isDisabled={isDisabled}
          aria-disabled={isDisabled}
          selectedKeys={selectedKeys}
          onSelectionChange={(v: SharedSelection) => {
            // SharedSelection can be 'all' or a Set-like object. Convert to array safely.
            let arr: string[] = [];
            if (v === "all") {
              arr = ["all"];
            } else if (v && typeof (v as Set<string>).forEach === "function") {
              try {
                arr = Array.from(v as Iterable<string>);
              } catch {
                arr = [];
              }
            } else if (typeof v === "string") {
              arr = [v];
            }
            onChange?.(((arr[0]?.toString() || "") as T) || "");
          }}
          onFocus={onFocus}
          size={size}
          classNames={{
            ...classNames?.nextUISelect,
            // error message and label are rendered outside of NextUI
            errorMessage: "hidden",
            label: "hidden",
          }}
        >
          {options.map((o) => {
            const getTextValue = () => {
              if (o.textValue) {
                return o.textValue;
              }
              if (typeof o.value === "string") {
                return o.value;
              }
              return undefined;
            };

            return (
              <SelectItem
                textValue={getTextValue()}
                key={o.id}
                value={o.id}
                className={
                  typeof o.value === "object"
                    ? "data-[hover=true]:bg-transparent p-0"
                    : ""
                }
              >
                {o.value}
              </SelectItem>
            );
          })}
        </ExtendedNextUISelectTyped>
        {!!helperText && (
          <span
            className={cn(
              "text-caption text-neutral-600 font-regular",
              "ml-1 mt-1.5",
              isError && "text-error-400",
              classNames?.helperText,
            )}
          >
            {helperText}
          </span>
        )}
      </div>
    </div>
  );
}
