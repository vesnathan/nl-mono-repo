import { useEffect } from "react";

/**
 * Hook to handle automatic suspicion level decay over time
 * Suspicion decreases by 1 point every 3 seconds when above 0
 */
export function useSuspicionDecay(
  suspicionLevel: number,
  setSuspicionLevel: (level: number | ((prev: number) => number)) => void,
) {
  useEffect(() => {
    if (suspicionLevel > 0) {
      const decayInterval = setInterval(() => {
        setSuspicionLevel((prev) => Math.max(0, prev - 1));
      }, 3000);
      return () => clearInterval(decayInterval);
    }
  }, [suspicionLevel, setSuspicionLevel]);
}
