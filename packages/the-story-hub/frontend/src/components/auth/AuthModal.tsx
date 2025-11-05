"use client";

import { useState } from "react";
import { LoginModal } from "./LoginModal";
import { RegistrationModal } from "./RegistrationModal";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "login" | "register";
  actionDescription?: string;
  onAuthSuccess?: () => void;
}

export function AuthModal({
  isOpen,
  onClose,
  initialMode = "login",
  actionDescription = "perform this action",
  onAuthSuccess,
}: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "register">(initialMode);

  const handleClose = () => {
    setMode(initialMode); // Reset to initial mode when closing
    onClose();
  };

  const switchToLogin = () => setMode("login");
  const switchToRegister = () => setMode("register");

  if (mode === "register") {
    return (
      <RegistrationModal
        isOpen={isOpen}
        onClose={handleClose}
        onSwitchToLogin={switchToLogin}
        onRegistrationSuccess={onAuthSuccess}
      />
    );
  }

  return (
    <LoginModal
      isOpen={isOpen}
      onClose={handleClose}
      actionDescription={actionDescription}
      onLoginSuccess={onAuthSuccess}
      onSwitchToRegister={switchToRegister}
    />
  );
}
