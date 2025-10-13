import { Button, cn } from "@nextui-org/react";
import { Spinner } from "@heroui/spinner";
import React from "react";

type AWSEButtonColor =
  | "primary"
  | "secondary"
  | "error"
  | "transparent"
  | "danger"
  | "cancel";
type AWSEButtonVariant = "solid" | "light";

type AWSEButtonProps = {
  id?: string;
  buttonText: React.ReactNode;
  size?: "sm" | "md";
  color?: AWSEButtonColor;
  variant?: AWSEButtonVariant;
  type?: "button" | "submit" | "reset";
  onClick?: (e: React.MouseEvent) => void;
  additionalClassName?: string;
  frontIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  isDisabled?: boolean;
  isLoading?: boolean;
};

export const AWSEButton: React.FC<AWSEButtonProps> = ({
  id,
  buttonText,
  size,
  color,
  variant = "solid",
  type = "button",
  onClick,
  additionalClassName,
  frontIcon,
  endIcon,
  isDisabled,
  isLoading,
}) => {
  const buttonClassName = React.useMemo<string>(() => {
    if (isDisabled && !isLoading) {
      return cn(
        "bg-neutral-50",
        "border-neutral-100",
        "font-semibold",
        "text-neutral-200",
        "cursor-not-allowed",
      );
    }

    const primaryColor = cn(
      "bg-primary-400 border-primary-400 text-white",
      "[&[data-hover=true]]:bg-primary-300 [&[data-hover=true]]:border-primary-300 [&[data-hover=true]]:text-white",
      "[&[data-pressed=true]]:bg-primary-500 [&[data-pressed=true]]:border-primary-500 [&[data-pressed=true]]:text-white",
      "data-[hover=true]:bg-primary-300 data-[hover=true]:border-primary-300 data-[hover=true]:text-white",
      "data-[pressed=true]:bg-primary-500 data-[pressed=true]:border-primary-500 data-[pressed=true]:text-white",
    );
    if (color === "primary") {
      return primaryColor;
    }
    if (color === "secondary") {
      return cn(
        "bg-white",
        "border-primary-500",
        "text-primary-500",
        "hover:bg-white",
        "hover:border-primary-400",
        "hover:text-primary-400",
        "active:border-primary-300",
        "active:text-primary-400",
      );
    }
    if (color === "transparent") {
      return cn(
        "bg-transparent",
        "border-transparent",
        "text-primary-500",
        "hover:bg-transparent",
        "hover:text-primary-400",
        "active:text-primary-500",
      );
    }
    if (color === "danger") {
      if (variant === "light") {
        return cn(
          "bg-transparent",
          "border-transparent",
          "text-danger-500",
          "hover:bg-danger-50",
          "hover:text-danger-600",
          "active:bg-danger-100",
          "active:text-danger-700",
        );
      }
      return cn(
        "bg-danger-500",
        "border-danger-500",
        "text-white",
        "hover:bg-danger-600",
        "hover:border-danger-600",
        "active:bg-danger-400",
        "active:border-danger-400",
      );
    }
    if (color === "cancel") {
      return cn(
        "bg-red-100",
        "border-red-300",
        "text-red-700",
        "hover:bg-red-200",
        "hover:border-red-400",
        "hover:text-red-800",
      );
    }
    // default
    return primaryColor;
  }, [color, variant, isDisabled, isLoading]);

  return (
    <Button
      id={id}
      size={size || "sm"}
      variant="flat"
      radius="sm"
      type={type}
      className={cn(
        "rounded-[6px] transition-all duration-200",
        buttonClassName,
        additionalClassName,
      )}
      onClick={isLoading ? undefined : onClick}
      disabled={isDisabled}
      startContent={isLoading ? <Spinner /> : frontIcon}
      endContent={endIcon}
    >
      {buttonText}
    </Button>
  );
};
