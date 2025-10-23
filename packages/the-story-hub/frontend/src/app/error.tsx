"use client";

import React from "react";
import { CustomButton } from "@/components/common/CustomButton";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <p>{error.message}</p>
      <CustomButton
        buttonText="Try again"
        onClick={() => reset()}
        type="button"
      />
    </div>
  );
}
