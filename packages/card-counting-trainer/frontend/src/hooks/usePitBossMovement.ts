import { useEffect } from "react";

/**
 * Hook to handle pit boss movement around the casino floor
 * Movement is influenced by suspicion level:
 * - High suspicion (70+): pit boss actively approaches (targets 60-80 range)
 * - Medium suspicion (40-70): pit boss investigates (targets 40-60 range)
 * - Low suspicion (0-40): pit boss patrols at distance (targets 20-40 range)
 */
export function usePitBossMovement(
  setPitBossDistance: (distance: number | ((prev: number) => number)) => void,
  suspicionLevel: number
) {
  useEffect(() => {
    const wanderInterval = setInterval(() => {
      setPitBossDistance((prev) => {
        // Random walk: small changes up or down
        const change = (Math.random() - 0.5) * 20; // -10 to +10
        let newDistance = prev + change;

        // Keep within bounds (10-90 range for more dynamic movement)
        newDistance = Math.max(10, Math.min(90, newDistance));

        // Suspicion influences pit boss behavior
        if (suspicionLevel >= 70) {
          // High suspicion: pit boss approaches and stays close
          if (newDistance < 60) {
            newDistance += Math.random() * 12; // Pull toward closer
          } else if (newDistance > 80) {
            newDistance -= Math.random() * 10; // Don't get too close
          }
        } else if (suspicionLevel >= 40) {
          // Medium suspicion: pit boss investigates, stays at medium distance
          if (newDistance < 40) {
            newDistance += Math.random() * 8; // Pull toward medium
          } else if (newDistance > 60) {
            newDistance -= Math.random() * 8; // Pull back to medium
          }
        } else {
          // Low suspicion: normal patrol behavior - stay farther away
          if (newDistance < 20) {
            // If very close, strongly push away
            newDistance += Math.random() * 10;
          } else if (newDistance > 50) {
            // If far, moderately pull back toward comfortable distance
            newDistance -= Math.random() * 8;
          } else if (newDistance > 40) {
            // If slightly far, gently pull back
            newDistance -= Math.random() * 4;
          }
        }

        return Math.round(newDistance);
      });
    }, 3000); // Change every 3 seconds

    return () => clearInterval(wanderInterval);
  }, [suspicionLevel, setPitBossDistance]);
}
