import { useCallback, useEffect } from "react";

interface UseEnterKeySubmitProps {
  onSubmit: () => void;
  isDisabled?: boolean;
}

export const useEnterKeySubmit = ({
  onSubmit,
  isDisabled = false,
}: UseEnterKeySubmitProps) => {
  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Enter" && !isDisabled) {
        event.preventDefault();
        onSubmit();
      }
    },
    [onSubmit, isDisabled],
  );

  useEffect(() => {
    document.addEventListener("keypress", handleKeyPress);
    return () => {
      document.removeEventListener("keypress", handleKeyPress);
    };
  }, [handleKeyPress]);
};
