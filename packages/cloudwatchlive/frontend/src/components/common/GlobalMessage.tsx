"use client";

import { Alert, AlertColor, Snackbar } from "@mui/material";
import React from "react";
import { create } from "zustand";

type MessageData = {
  color: AlertColor;
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
  const closeMessage = () => setGlobalMessage(null);

  if (!globalMessage) {
    return null;
  }

  return (
    <Snackbar
      open={!!globalMessage}
      // if error message keep it there until user close it manually
      autoHideDuration={globalMessage.color === "error" ? undefined : 3000}
      onClose={closeMessage}
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
    >
      <Alert
        onClose={closeMessage}
        severity={globalMessage.color}
        variant="filled"
        color={globalMessage.color}
        sx={{ width: "100%" }}
      >
        {globalMessage.content}
      </Alert>
    </Snackbar>
  );
};
