/* eslint-disable react/no-unstable-nested-components */
import React from "react";
import { ErrorBoundary, FallbackProps } from "react-error-boundary";
import { useEffectOnce } from "@/hooks/useEffectOnce";
import { awsbButton } from "@/components/common/awsbButton";

const ErrorBoundaryFallback: React.FC<FallbackProps> = ({
  error,
  resetErrorBoundary,
}) => {
  useEffectOnce(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  });
  return (
    <div className="bg-red-500 p-2 shadow-md text-center">
      <span className="text-white">An unexpected error has occurred</span>
      <awsbButton buttonText="Retry" onClick={resetErrorBoundary} />
    </div>
  );
};

type Props = React.PropsWithChildren<object>;
export const awsbErrorBoundary: React.FC<Props> = ({ children }) => {
  return (
    <ErrorBoundary
      fallbackRender={(fallbackProps) => {
        return <ErrorBoundaryFallback {...fallbackProps} />;
      }}
    >
      {children}
    </ErrorBoundary>
  );
};
