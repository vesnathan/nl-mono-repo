"use client";

import { useState } from "react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: () => void;
}

type AuthMode = "login" | "register";

export default function AuthModal({
  isOpen,
  onClose,
  onLoginSuccess,
}: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (mode === "register" && password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    // TODO: Implement actual authentication
    // For now, just simulate success after a delay
    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess?.();
      onClose();
    }, 1000);
  };

  const toggleMode = () => {
    setMode(mode === "login" ? "register" : "login");
    setError("");
    setConfirmPassword("");
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10001,
      }}
      onClick={onClose}
    >
      <div
        style={{
          position: "relative",
          backgroundColor: "rgba(0, 0, 0, 0.95)",
          border: "3px solid #FFD700",
          borderRadius: "16px",
          padding: "32px",
          minWidth: "400px",
          maxWidth: "500px",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.8)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title */}
        <h2
          style={{
            fontSize: "28px",
            fontWeight: "bold",
            color: "#FFD700",
            marginBottom: "8px",
            textAlign: "center",
          }}
        >
          {mode === "login" ? "Welcome Back!" : "Create Account"}
        </h2>

        <p
          style={{
            color: "#AAA",
            textAlign: "center",
            marginBottom: "24px",
            fontSize: "14px",
          }}
        >
          {mode === "login"
            ? "Log in to track your progress and save your stats"
            : "Register to start tracking your blackjack training"}
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ marginBottom: "16px" }}>
          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                color: "#FFF",
                marginBottom: "8px",
                fontSize: "14px",
              }}
            >
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              style={{
                width: "100%",
                padding: "12px",
                backgroundColor: "#1F1F1F",
                border: "2px solid #444",
                borderRadius: "8px",
                color: "#FFF",
                fontSize: "16px",
                outline: "none",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#FFD700")}
              onBlur={(e) => (e.target.style.borderColor = "#444")}
            />
          </div>

          <div style={{ marginBottom: mode === "register" ? "16px" : "0" }}>
            <label
              style={{
                display: "block",
                color: "#FFF",
                marginBottom: "8px",
                fontSize: "14px",
              }}
            >
              Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={isPasswordVisible ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                style={{
                  width: "100%",
                  padding: "12px",
                  paddingRight: "40px",
                  backgroundColor: "#1F1F1F",
                  border: "2px solid #444",
                  borderRadius: "8px",
                  color: "#FFF",
                  fontSize: "16px",
                  outline: "none",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#FFD700")}
                onBlur={(e) => (e.target.style.borderColor = "#444")}
              />
              <button
                type="button"
                onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "#888",
                  cursor: "pointer",
                  fontSize: "18px",
                }}
              >
                {isPasswordVisible ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </div>

          {mode === "register" && (
            <div style={{ marginBottom: "0", marginTop: "16px" }}>
              <label
                style={{
                  display: "block",
                  color: "#FFF",
                  marginBottom: "8px",
                  fontSize: "14px",
                }}
              >
                Confirm Password
              </label>
              <input
                type={isPasswordVisible ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
                style={{
                  width: "100%",
                  padding: "12px",
                  backgroundColor: "#1F1F1F",
                  border: "2px solid #444",
                  borderRadius: "8px",
                  color: "#FFF",
                  fontSize: "16px",
                  outline: "none",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#FFD700")}
                onBlur={(e) => (e.target.style.borderColor = "#444")}
              />
            </div>
          )}

          {error && (
            <p
              style={{
                color: "#EF4444",
                fontSize: "14px",
                marginTop: "12px",
              }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading || !email || !password}
            style={{
              width: "100%",
              marginTop: "24px",
              padding: "12px 24px",
              backgroundColor:
                isLoading || !email || !password ? "#666" : "#4CAF50",
              color: "#FFF",
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: isLoading || !email || !password ? "not-allowed" : "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              if (!isLoading && email && password) {
                e.currentTarget.style.backgroundColor = "#45a049";
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading && email && password) {
                e.currentTarget.style.backgroundColor = "#4CAF50";
              }
            }}
          >
            {isLoading
              ? "Please wait..."
              : mode === "login"
                ? "Log In"
                : "Create Account"}
          </button>
        </form>

        {/* Toggle Mode */}
        <div style={{ textAlign: "center", marginBottom: "16px" }}>
          <button
            onClick={toggleMode}
            disabled={isLoading}
            style={{
              background: "none",
              border: "none",
              color: "#FFD700",
              cursor: isLoading ? "not-allowed" : "pointer",
              fontSize: "14px",
              textDecoration: "underline",
            }}
          >
            {mode === "login"
              ? "Don't have an account? Register"
              : "Already have an account? Log in"}
          </button>
        </div>

        {/* Divider */}
        <div
          style={{
            position: "relative",
            width: "100%",
            margin: "24px 0",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: "100%",
                borderTop: "1px solid #444",
              }}
            />
          </div>
          <div
            style={{
              position: "relative",
              display: "flex",
              justifyContent: "center",
              fontSize: "14px",
            }}
          >
            <span
              style={{
                padding: "0 8px",
                backgroundColor: "rgba(0, 0, 0, 0.95)",
                color: "#888",
              }}
            >
              Or continue with
            </span>
          </div>
        </div>

        {/* Social Login Buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <button
            disabled={isLoading}
            style={{
              width: "100%",
              padding: "12px 24px",
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              color: "#FFF",
              border: "2px solid rgba(255, 255, 255, 0.3)",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "bold",
              cursor: isLoading ? "not-allowed" : "pointer",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.backgroundColor =
                  "rgba(255, 255, 255, 0.2)";
                e.currentTarget.style.borderColor = "#FFF";
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.currentTarget.style.backgroundColor =
                  "rgba(255, 255, 255, 0.1)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.3)";
              }
            }}
          >
            <span>🔐</span>
            Google
          </button>
        </div>

        {/* Cancel Button */}
        <button
          onClick={onClose}
          disabled={isLoading}
          style={{
            width: "100%",
            marginTop: "16px",
            padding: "10px 24px",
            backgroundColor: "transparent",
            color: "#AAA",
            border: "2px solid #666",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: "bold",
            cursor: isLoading ? "not-allowed" : "pointer",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            if (!isLoading) {
              e.currentTarget.style.borderColor = "#FFD700";
              e.currentTarget.style.color = "#FFF";
            }
          }}
          onMouseLeave={(e) => {
            if (!isLoading) {
              e.currentTarget.style.borderColor = "#666";
              e.currentTarget.style.color = "#AAA";
            }
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
