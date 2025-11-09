import { useState, useCallback } from "react";

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
   * @param message - The message to log
   */
  const addDebugLog = useCallback((message: string) => {
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
