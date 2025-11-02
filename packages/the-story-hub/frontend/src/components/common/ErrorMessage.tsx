"use client";

import { Button } from "@nextui-org/react";

interface ErrorMessageProps {
  title?: string;
  message: string;
  retry?: () => void;
}

export function ErrorMessage({
  title = "Error",
  message,
  retry,
}: ErrorMessageProps) {
  return (
    <div className="max-w-md mx-auto p-6 bg-red-900/20 border border-red-700 rounded-lg">
      <div className="text-center space-y-4">
        <div className="text-4xl">⚠️</div>
        <h3 className="text-xl font-bold text-red-400">{title}</h3>
        <p className="text-red-400">{message}</p>
        {retry && (
          <Button
            type="button"
            color="danger"
            onClick={retry}
            className="bg-red-700 hover:bg-red-600"
          >
            Try Again
          </Button>
        )}
      </div>
    </div>
  );
}
