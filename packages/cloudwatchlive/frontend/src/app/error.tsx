"use client";

import React from "react";
import { CWLButton } from "@/components/common/CWLButton";

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
      <CWLButton buttonText="Try again" onClick={() => reset()} type="button" />
    </div>
  );
}
