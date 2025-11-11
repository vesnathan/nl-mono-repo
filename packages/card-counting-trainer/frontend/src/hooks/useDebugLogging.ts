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
   * Clear all debug logs and hide the debug panel
   */
  const clearDebugLogs = useCallback(() => {
    // Clear the logs and console
    // eslint-disable-next-line no-console
    console.clear();
    setDebugLogs([]);
    setShowDebugLog(false);
  }, []);

  return {
    debugLogs,
    setDebugLogs,
    showDebugLog,
    setShowDebugLog,
    clearDebugLogs,
  };
}
