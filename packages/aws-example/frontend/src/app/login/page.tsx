"use client";

import RegistrationLayout from "@/components/layout/RegistrationLayout";
import LoginComponent from "@/components/routes/login/LoginComponent";
import React from "react";

export default function Page() {
  return (
    <RegistrationLayout>
      <LoginComponent />
    </RegistrationLayout>
  );
}
