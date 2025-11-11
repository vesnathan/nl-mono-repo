import { useCallback, useEffect, useRef } from "react";

/**
 * Custom hook for managing game timeouts with automatic cleanup
 * Tracks all active timeouts and provides utilities for registration and cleanup
 *
 * @returns Object with timeout management functions
 */
export function useGameTimeouts() {
  const timeoutsRef = useRef<Set<NodeJS.Timeout>>(new Set());

  /**
   * Register a timeout that will be auto-cleaned on component unmount
   * The timeout automatically removes itself from tracking when it fires
   *
   * @param callback - Function to execute after delay
   * @param delay - Delay in milliseconds
   * @returns The timeout ID
   */
  const registerTimeout = useCallback((callback: () => void, delay: number) => {
    const timeout = setTimeout(() => {
      callback();
      timeoutsRef.current.delete(timeout);
    }, delay);
    timeoutsRef.current.add(timeout);
    return timeout;
  }, []);

  /**
   * Clear all active timeouts and reset the tracking set
   * Useful for phase transitions or component cleanup
   */
  const clearAllTimeouts = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current.clear();
  }, []);

  // Cleanup all timeouts on unmount
  useEffect(() => {
    return () => clearAllTimeouts();
  }, [clearAllTimeouts]);

  return {
    registerTimeout,
    clearAllTimeouts,
    timeoutsRef,
  };
}
