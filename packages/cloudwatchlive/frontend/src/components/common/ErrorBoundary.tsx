/* eslint-disable react/no-unstable-nested-components */
import React from "react";
import { ErrorBoundary, FallbackProps } from "react-error-boundary";
import { useEffectOnce } from "@/hooks/useEffectOnce";
import { CWLButton } from "@/components/common/CWLButton";

const ErrorBoundaryFallback: React.FC<FallbackProps> = ({
  error,
  resetErrorBoundary,
}) => {
  useEffectOnce(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  });
  return (
    <div className="bg-error-500 p-2 shadow-md text-center">
      <span className="text-white">An unexpected error has occurred</span>
      <CWLButton buttonText="Retry" onClick={resetErrorBoundary} />
    </div>
  );
};

type Props = React.PropsWithChildren<object>;
export const CWLErrorBoundary: React.FC<Props> = ({ children }) => {
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
