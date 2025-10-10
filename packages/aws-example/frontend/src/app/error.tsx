"use client";

import React from "react";
import { awsbButton } from "@/components/common/awsbButton";

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
      <awsbButton
        buttonText="Try again"
        onClick={() => reset()}
        type="button"
      />
    </div>
  );
}
