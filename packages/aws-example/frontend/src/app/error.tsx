"use client";

import React from "react";
import { AWSBButton } from "@/components/common/AWSBButton";

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
      <AWSBButton
        buttonText="Try again"
        onClick={() => reset()}
        type="button"
      />
    </div>
  );
}
