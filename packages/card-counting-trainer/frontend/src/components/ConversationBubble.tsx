"use client";

import { useState, useEffect } from "react";
import { ResponseOption } from "@/data/dialogue";

interface ConversationBubbleProps {
  speaker: string; // Character name
  message: string;
  requiresPlayerResponse?: boolean;
  responseOptions?: ResponseOption[];
  onResponse?: (option: ResponseOption) => void;
  position?: { bottom: string; left: string }; // Position on screen
  registerTimeout: (callback: () => void, delay: number) => NodeJS.Timeout;
}

export default function ConversationBubble({
  speaker,
  message,
  requiresPlayerResponse = false,
  responseOptions = [],
  onResponse,
  position = { bottom: "120px", left: "50%" },
  registerTimeout,
}: ConversationBubbleProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedOption, setSelectedOption] = useState<ResponseOption | null>(
    null,
  );

  // Fade in animation
  useEffect(() => {
    registerTimeout(() => setIsVisible(true), 100);
  }, [registerTimeout]);

  // Auto-dismiss after 8 seconds if no response required
  useEffect(() => {
    if (!requiresPlayerResponse) {
      registerTimeout(() => setIsVisible(false), 8000);
    }
  }, [requiresPlayerResponse, registerTimeout]);

  const handleResponse = (option: ResponseOption) => {
    setSelectedOption(option);
    registerTimeout(() => {
      setIsVisible(false);
      onResponse?.(option);
    }, 500);
  };

  if (!isVisible && selectedOption) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: position.bottom,
        left: position.left,
        transform: "translateX(-50%)",
        zIndex: 3000,
        maxWidth: "600px",
        opacity: isVisible ? 1 : 0,
        transition: "opacity 0.3s ease-in-out",
      }}
    >
      {/* Conversation bubble */}
      <div
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.9)",
          border: "2px solid #FFD700",
          borderRadius: "16px",
          padding: "16px 20px",
          boxShadow: "0 8px 24px rgba(0, 0, 0, 0.8)",
        }}
      >
        {/* Speaker name */}
        <div
          style={{
            fontSize: "12px",
            fontWeight: "bold",
            color: "#FFD700",
            marginBottom: "8px",
            textTransform: "uppercase",
          }}
        >
          {speaker}
        </div>

        {/* Message */}
        <div
          style={{
            fontSize: "15px",
            color: "#FFF",
            marginBottom: requiresPlayerResponse ? "16px" : "0",
            lineHeight: "1.5",
          }}
        >
          {message}
        </div>

        {/* Response buttons - only show if player response required */}
        {requiresPlayerResponse && responseOptions.length > 0 && (
          <div
            style={{
              display: "flex",
              gap: "8px",
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            {responseOptions.map((option) => (
              <button
                type="button"
                key={option}
                onClick={() => handleResponse(option)}
                disabled={selectedOption !== null}
                style={{
                  backgroundColor:
                    option.type === "friendly"
                      ? "#4CAF50"
                      : option.type === "neutral"
                        ? "#2196F3"
                        : "#9E9E9E",
                  color: "#FFF",
                  border: "none",
                  borderRadius: "8px",
                  padding: "10px 16px",
                  fontSize: "13px",
                  fontWeight: "bold",
                  cursor: selectedOption ? "default" : "pointer",
                  opacity:
                    selectedOption && selectedOption !== option ? 0.4 : 1,
                  transition: "all 0.2s ease",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
                }}
                onMouseEnter={(e) => {
                  if (!selectedOption) {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow =
                      "0 4px 12px rgba(0, 0, 0, 0.4)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!selectedOption) {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow =
                      "0 2px 8px rgba(0, 0, 0, 0.3)";
                  }
                }}
              >
                {option.text}
                {option.suspicionIncrease > 0 && (
                  <span
                    style={{
                      fontSize: "10px",
                      marginLeft: "6px",
                      opacity: 0.7,
                    }}
                  >
                    (+{option.suspicionIncrease})
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Pointer/tail */}
      <div
        style={{
          position: "absolute",
          bottom: "-10px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "0",
          height: "0",
          borderLeft: "12px solid transparent",
          borderRight: "12px solid transparent",
          borderTop: "12px solid #FFD700",
        }}
      />
    </div>
  );
}
