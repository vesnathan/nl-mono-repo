"use client";

import React from "react";
import { ANAButton } from "@/components/common/ANAButton";

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
      <ANAButton buttonText="Try again" onClick={() => reset()} type="button" />
    </div>
  );
}
