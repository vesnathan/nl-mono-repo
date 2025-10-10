"use client";

import RegistrationLayout from "@/components/layout/RegistrationLayout";
import LogoutComponent from "@/components/routes/logout/LogoutComponent";
import React from "react";

export default function Page() {
  return (
    <RegistrationLayout>
      <LogoutComponent />
    </RegistrationLayout>
  );
}
