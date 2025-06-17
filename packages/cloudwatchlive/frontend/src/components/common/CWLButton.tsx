import { Button, cn } from "@nextui-org/react";
import React from "react";

type CWLButtonColor = "primary" | "secondary" | "error" | "transparent";

type CWLButtonProps = {
  id?: string;
  buttonText: React.ReactNode;
  size?: "sm" | "md";
  color?: CWLButtonColor;
  onClick?: (e: React.MouseEvent) => void;
  additionalClassName?: string;
  frontIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  isDisabled?: boolean;
};

export const CWLButton: React.FC<CWLButtonProps> = ({
  id,
  buttonText,
  size,
  color,
  onClick,
  additionalClassName,
  frontIcon,
  endIcon,
  isDisabled,
}) => {
  const buttonClassName = React.useMemo<string>(() => {
    if (isDisabled) {
      return cn(
        "bg-neutral-50",
        "border-neutral-100",
        "font-semibold",
        "text-neutral-200",
        "cursor-not-allowed",
      );
    }

    const primaryColor = cn(
      "bg-primary-400",
      "border-primary-400",
      "hover:bg-primary-500",
      "hover:border-primary-500",
      "active:bg-primary-300",
      "active:border-primary-300",
      "active:text-primary-500",
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
    // default
    return primaryColor;
  }, [color, isDisabled]);

  return (
    <Button
      id={id}
      size={size || "sm"}
      variant="ghost"
      radius="sm"
      className={cn("rounded-[6px]", buttonClassName, additionalClassName)}
      onClick={onClick}
      disabled={isDisabled}
      startContent={frontIcon}
      endContent={endIcon}
    >
      {buttonText}
    </Button>
  );
};
