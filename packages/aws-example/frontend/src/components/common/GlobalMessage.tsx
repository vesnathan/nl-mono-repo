"use client";

import React, { useState, useEffect } from "react";
import { create } from "zustand";
import { Card } from "@nextui-org/react";

type MessageData = {
  color: "success" | "warning" | "error" | "info";
  content: React.ReactNode;
};

type MessageStore = {
  message: MessageData | null;
  setMessage: (message: MessageData | null) => void;
};

const useMessageStore = create<MessageStore>((set) => ({
  message: null,
  setMessage: (message: MessageData | null) => set({ message }),
}));

export const useSetGlobalMessage = () =>
  useMessageStore((state) => state.setMessage);

export const GlobalMessage: React.FC = () => {
  const globalMessage = useMessageStore((state) => state.message);
  const setGlobalMessage = useSetGlobalMessage();
  const [isVisible, setIsVisible] = useState(false);

  const closeMessage = () => {
    setGlobalMessage(null);
    setIsVisible(false);
  };

  // eslint-disable-next-line consistent-return
  useEffect(() => {
    if (globalMessage) {
      setIsVisible(true);

      if (globalMessage.color !== "error") {
        const timeout = setTimeout(closeMessage, 3000);
        return () => clearTimeout(timeout); // Explicit return for the cleanup function
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalMessage]);

  if (!globalMessage || !isVisible) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "16px",
        left: "16px",
        zIndex: 9999,
        maxWidth: "300px",
      }}
    >
      <Card
        style={{
          backgroundColor:
            globalMessage.color === "success"
              ? "#4caf50"
              : globalMessage.color === "warning"
                ? "#ff9800"
                : globalMessage.color === "error"
                  ? "#f44336"
                  : "#2196f3",
          color: "white",
        }}
      >
        <div style={{ padding: "16px" }}>
          <p style={{ margin: 0 }}>{globalMessage.content}</p>
          <div
            onClick={closeMessage}
            style={{
              marginTop: "8px",
              color: "white",
              textDecoration: "underline",
              cursor: "pointer",
            }}
            tabIndex={0}
            role="button"
            onKeyDown={() => {}}
          >
            Close
          </div>
        </div>
      </Card>
    </div>
  );
};
