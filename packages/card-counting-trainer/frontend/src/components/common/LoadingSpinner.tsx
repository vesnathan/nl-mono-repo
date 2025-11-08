"use client";

import React from "react";
import { Spinner } from "@nextui-org/react";

export const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Spinner size="lg" color="warning" />
    </div>
  );
};
