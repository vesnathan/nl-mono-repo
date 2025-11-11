import { useState, useCallback } from "react";
import { DEBUG } from "@/utils/debug";

/**
 * Custom hook for managing debug logging state and operations
 * Provides timestamped logging with console output and in-memory storage
 *
 * @returns Object with debug logging state and functions
 */
export function useDebugLogging() {
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [showDebugLog, setShowDebugLog] = useState(false);

  /**
   * Add a timestamped debug log entry
   * Logs to console and stores in state for UI display
   *
   * Now respects DEBUG flags from debug.ts - only logs if the category is enabled
   *
   * @param message - The message to log
   */
  const addDebugLog = useCallback((message: string) => {
    // Determine which debug category this log belongs to based on content
    const shouldLog =
      (message.includes('DEALING') || message.includes('Dealt card') || message.includes('card round')) && DEBUG.dealCards ||
      (message.includes('DEALER') && (message.includes('audio') || message.includes('speech'))) && DEBUG.dealerSpeech ||
      (message.includes('HIT') || message.includes('STAND') || message.includes('DOUBLE') || message.includes('SPLIT')) && DEBUG.playerActions ||
      (message.includes('AI') && message.includes('TURN')) && DEBUG.aiTurns ||
      (message.includes('BETTING') || message.includes('bet')) && DEBUG.betting ||
      (message.includes('PHASE:') || message.includes('Phase:') || message.includes('Transitioning')) && DEBUG.gamePhases ||
      (message.includes('suspicion') || message.includes('heat')) && DEBUG.suspicion ||
      (message.includes('conversation') || message.includes('Conversation')) && DEBUG.conversations ||
      (message.includes('insurance') || message.includes('Insurance')) && DEBUG.insurance ||
      (message.includes('Audio Queue') || message.includes('audio')) && DEBUG.audioQueue ||
      (message.includes('speech bubble') || message.includes('Speech bubble')) && DEBUG.speechBubbles;

    if (!shouldLog) {
      // Still store in logs array for the debug modal, but don't console.log
      const timestamp = new Date().toISOString().split("T")[1].split(".")[0];
      const logEntry = `[${timestamp}] ${message}`;
      setDebugLogs((prev) => [...prev, logEntry]);
      return;
    }

    const timestamp = new Date().toISOString().split("T")[1].split(".")[0];
    const logEntry = `[${timestamp}] ${message}`;
    // eslint-disable-next-line no-console
    console.log(logEntry);
    setDebugLogs((prev) => [...prev, logEntry]);
  }, []);

  /**
   * Clear all debug logs and hide the debug panel
   * Adds a final "cleared" message before clearing
   */
  const clearDebugLogs = useCallback(() => {
    addDebugLog("=== LOG CLEARED - CONTINUING TO NEXT HAND ===");

    // Clear the logs after a brief moment so the final message is visible
    setTimeout(() => {
      // eslint-disable-next-line no-console
      console.clear();
      setDebugLogs([]);
      setShowDebugLog(false);
    }, 100);
  }, [addDebugLog]);

  return {
    debugLogs,
    setDebugLogs,
    showDebugLog,
    setShowDebugLog,
    addDebugLog,
    clearDebugLogs,
  };
}
