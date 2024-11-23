"use client";
import RegistrationLayout from "@/components/layout/RegistrationLayout";
import LoginComponent from "@/components/routes/LoginComponent";
import React from "react";

export default function LoginPage() {
  return (
    <RegistrationLayout>
      <LoginComponent />
    </RegistrationLayout>
  );
}
