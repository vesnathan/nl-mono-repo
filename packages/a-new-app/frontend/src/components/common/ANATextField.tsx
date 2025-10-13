import { Input, InputProps, cn, extendVariants } from "@nextui-org/react";
import React, { useId } from "react";
import { EyeFilledIcon, EyeSlashFilledIcon } from "./EyeSVGR";

const innerWrapperClassname = "";
const baseClassname = "";

const inputWrapperClassnames = [
  "h-full",
  "bg-white",
  "rounded-md",
  "border-1",
  "border-neutral-200",
  "group-data-[focus=true]:border-primary-500",
  "data-[hover=true]:border-primary-500",
];

const inputClassName = [
  "h-[20px]",
  "placeholder:text-neutral-300",
  "border-none",
  "outline-none",
  "bg-transparent",
];

const ExtendedNextUIInput = extendVariants(Input, {
  variants: {
    size: {
      sm: {
        base: cn(baseClassname, "h-[38px]"),
        inputWrapper: cn(...inputWrapperClassnames, "px-3 py-2"),
        innerWrapper: cn(innerWrapperClassname),
        input: cn(...inputClassName),
      },
      md: {
        base: cn(baseClassname, "h-[40px]"),
        inputWrapper: cn(...inputWrapperClassnames, "px-3 py-2.5"),
        innerWrapper: cn(innerWrapperClassname),
        input: cn(...inputClassName),
      },
    },
  },
});

export interface ANATextFieldProps {
  id?: string;
  testId?: string;
  type?: "text" | "number" | "date" | "password" | "time";
  name?: string;
  // default to sm
  size?: "sm" | "md";
  label?: React.ReactNode;
  subLabel?: React.ReactNode;
  placeholder?: string;
  helperText?: React.ReactNode;

  defaultValue?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>, value: string) => void;
  onFocus?: (e: React.FocusEvent) => void;
  onBlur?: (e: React.FocusEvent) => void;
  onKeyUp?: (e: React.KeyboardEvent) => void;

  isDisabled?: boolean;
  isError?: boolean;
  isOptional?: boolean;

  onClear?: () => void;
  startContent?: React.ReactNode;
  endContent?: React.ReactNode;

  inputProps?: Partial<InputProps>;

  // override classNames
  classNames?: {
    root?: string;
    label?: string;
    inputWrapper?: string;
    helperText?: string;
    placeholder?: string;
  };

  customClassName?: string;

  minRows?: number;
  autoFocus?: boolean;
}

export const ANATextField = React.forwardRef<
  HTMLInputElement,
  ANATextFieldProps
>((props, refToforward) => {
  const {
    id,
    type,
    testId,
    label,
    subLabel,
    placeholder,
    defaultValue,
    value,
    onChange,
    onFocus,
    onBlur,
    onClear,
    onKeyUp,
    isDisabled,
    isError,
    isOptional,
    helperText,
    classNames,
    size = "sm",
    startContent,
    endContent,
    inputProps,
    name,
    autoFocus,
    customClassName,
  } = props;
  const reactId = useId();
  const inputId = id ?? reactId;

  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [isVisible, setIsVisible] = React.useState(false);

  const toggleVisibility = () => setIsVisible(!isVisible);
  return (
    <div className={cn("w-full", classNames?.root)}>
      {!!label && (
        <label
          htmlFor={inputId}
          className={cn(
            "text-neutral-900 text-body2 font-semibold",
            classNames?.label,
          )}
        >
          {label}
          {isOptional && (
            <span className="text-neutral-600 ml-1">(Optional)</span>
          )}
        </label>
      )}
      {subLabel && (
        <span className="text-neutral-600 text-[14px] ml-1">{subLabel}</span>
      )}

      <div className={cn("flex flex-col w-full", classNames?.inputWrapper)}>
        <ExtendedNextUIInput
          autoFocus={autoFocus}
          id={inputId}
          data-testid={testId}
          name={name}
          size={size}
          variant="bordered"
          ref={(r: HTMLInputElement | null) => {
            if (typeof refToforward === "function") {
              refToforward(r);
            } else if (refToforward) {
              // eslint-disable-next-line no-param-reassign
              refToforward.current = r;
            }
            inputRef.current = r;
          }}
          type={type === "password" ? (isVisible ? "text" : "password") : type}
          data-has-error={!!isError}
          isDisabled={isDisabled}
          aria-disabled={isDisabled}
          defaultValue={defaultValue}
          value={value}
          placeholder={placeholder}
          radius="sm"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            onChange?.(e, e.target.value);
          }}
          onKeyUp={onKeyUp}
          onFocus={onFocus}
          onBlur={onBlur}
          onClear={onClear}
          {...inputProps}
          // error message and label is rendered outside of NextUI
          classNames={{
            errorMessage: "hidden",
            label: "hidden",
            inputWrapper: cn(isDisabled && "bg-neutral-100"),
            innerWrapper: "flex items-center",
          }}
          className={customClassName}
          startContent={startContent}
          endContent={
            type === "password" ? (
              <button
                className="focus:outline-none h-full flex items-center justify-center"
                type="button"
                onClick={toggleVisibility}
              >
                {!isVisible ? (
                  <EyeSlashFilledIcon className="text-2xl text-default-400 pointer-events-none" />
                ) : (
                  <EyeFilledIcon className="text-2xl text-default-400 pointer-events-none" />
                )}
              </button>
            ) : (
              endContent
            )
          }
        />
        {!!helperText && (
          <span
            className={cn(
              " text-red-400 font-bold text-sm",
              "ml-1 mt-1.5",
              classNames?.helperText,
            )}
          >
            {helperText}
          </span>
        )}
      </div>
    </div>
  );
});
