import { useEffect } from "react";

/**
 * Hook to handle pit boss random movement around the casino floor
 */
export function usePitBossMovement(
  setPitBossDistance: (distance: number | ((prev: number) => number)) => void
) {
  useEffect(() => {
    const interval = setInterval(() => {
      setPitBossDistance((prev) => {
        const movement = Math.random() * 20 - 8;
        return Math.max(0, Math.min(100, prev + movement));
      });
    }, 8000);

    return () => clearInterval(interval);
  }, [setPitBossDistance]);
}
