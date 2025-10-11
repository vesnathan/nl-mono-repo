import React from "react";
import { AWSBButton } from "./AWSBButton";

interface Props {
  error: unknown;
  errorMessage?: React.ReactNode;
  retry?: () => void;
}

export const DataFetchError: React.FC<Props> = ({
  error,
  errorMessage,
  retry,
}) => {
  // eslint-disable-next-line no-console
  console.error(error);
  return (
    <div className="bg-error-500 p-2 shadow-md text-center">
      <span className="text-white">
        {errorMessage || "An unexpected error occurred while fetching data"}
      </span>
      {retry && (
        <AWSBButton
          buttonText="Retry"
          onClick={retry}
          type="button"
          variant="light"
          additionalClassName="ml-2"
        />
      )}
    </div>
  );
};
