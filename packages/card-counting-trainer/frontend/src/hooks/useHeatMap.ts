import { useEffect, useRef } from "react";

/**
 * Data point for heat map tracking
 * Tracks pit boss proximity at different count levels
 */
export interface HeatMapDataPoint {
  trueCount: number; // The true count at this moment
  pitBossDistance: number; // 0-100, higher = closer
  timestamp: number; // When this was recorded
  betSize: number; // What bet was placed
  suspicionLevel: number; // Pit boss attention level
}

/**
 * Aggregated heat map data for visualization
 * Groups pit boss distance by count ranges
 */
export interface HeatMapBucket {
  countRange: string; // e.g., "-2 to -1", "0 to 1", "+4 to +5"
  avgDistance: number; // Average pit boss distance in this count range
  samples: number; // Number of data points in this bucket
  minDistance: number; // Closest the pit boss got
  maxDistance: number; // Farthest the pit boss was
}

interface UseHeatMapParams {
  trueCount: number;
  pitBossDistance: number;
  currentBet: number;
  suspicionLevel: number;
  phase: string;
  initialized: boolean;
}

/**
 * Hook to track pit boss proximity correlated with true count
 * This helps identify if player is being discreet with bet spreads
 */
export function useHeatMap({
  trueCount,
  pitBossDistance,
  currentBet,
  suspicionLevel,
  phase,
  initialized,
}: UseHeatMapParams) {
  const dataPointsRef = useRef<HeatMapDataPoint[]>([]);
  const lastRecordedPhaseRef = useRef<string>("");

  // Record a data point at the start of each new hand (during BETTING phase)
  useEffect(() => {
    if (!initialized) return;

    // Only record once per hand, at the start of betting
    if (phase === "BETTING" && lastRecordedPhaseRef.current !== "BETTING") {
      const dataPoint: HeatMapDataPoint = {
        trueCount: Math.round(trueCount * 2) / 2, // Round to nearest 0.5 for bucketing
        pitBossDistance,
        timestamp: Date.now(),
        betSize: currentBet,
        suspicionLevel,
      };

      dataPointsRef.current.push(dataPoint);

      // Keep only last 500 data points to prevent memory bloat
      if (dataPointsRef.current.length > 500) {
        dataPointsRef.current = dataPointsRef.current.slice(-500);
      }
    }

    lastRecordedPhaseRef.current = phase;
  }, [phase, trueCount, pitBossDistance, currentBet, suspicionLevel, initialized]);

  /**
   * Get aggregated heat map data grouped by count ranges
   */
  const getHeatMapBuckets = (): HeatMapBucket[] => {
    const buckets = new Map<number, HeatMapDataPoint[]>();

    // Group data points into count buckets (ranges of 1)
    dataPointsRef.current.forEach((point) => {
      const bucketKey = Math.floor(point.trueCount);
      if (!buckets.has(bucketKey)) {
        buckets.set(bucketKey, []);
      }
      buckets.get(bucketKey)!.push(point);
    });

    // Calculate statistics for each bucket
    const result: HeatMapBucket[] = [];
    buckets.forEach((points, countKey) => {
      const distances = points.map((p) => p.pitBossDistance);
      const avgDistance =
        distances.reduce((sum, d) => sum + d, 0) / distances.length;
      const minDistance = Math.min(...distances);
      const maxDistance = Math.max(...distances);

      // Format count range label
      const countRange =
        countKey >= 0
          ? `+${countKey} to +${countKey + 1}`
          : `${countKey} to ${countKey + 1}`;

      result.push({
        countRange,
        avgDistance: Math.round(avgDistance),
        samples: points.length,
        minDistance,
        maxDistance,
      });
    });

    // Sort by count (lowest to highest)
    return result.sort((a, b) => {
      const aCount = parseInt(a.countRange.split(" ")[0]);
      const bCount = parseInt(b.countRange.split(" ")[0]);
      return aCount - bCount;
    });
  };

  /**
   * Get raw data points for detailed analysis
   */
  const getRawDataPoints = (): HeatMapDataPoint[] => {
    return [...dataPointsRef.current];
  };

  /**
   * Calculate discretion score (0-100)
   * Higher score = better camouflage
   * Lower score = pit boss clearly following your count
   */
  const getDiscretionScore = (): number => {
    const buckets = getHeatMapBuckets();
    if (buckets.length < 3) return 100; // Not enough data

    // Compare pit boss distance at negative counts vs positive counts
    const negativeBuckets = buckets.filter((b) => b.countRange.startsWith("-"));
    const positiveBuckets = buckets.filter((b) => b.countRange.startsWith("+"));

    if (negativeBuckets.length === 0 || positiveBuckets.length === 0) {
      return 100; // Not enough data in both ranges
    }

    const avgNegativeDistance =
      negativeBuckets.reduce((sum, b) => sum + b.avgDistance, 0) /
      negativeBuckets.length;
    const avgPositiveDistance =
      positiveBuckets.reduce((sum, b) => sum + b.avgDistance, 0) /
      positiveBuckets.length;

    // If pit boss is significantly closer during positive counts, discretion is low
    const distanceDifference = avgPositiveDistance - avgNegativeDistance;

    // Convert to score:
    // - If pit boss is 30+ closer during positive counts, score = 0 (very obvious)
    // - If pit boss distance is random (difference near 0), score = 100 (perfect camouflage)
    const rawScore = 100 - Math.abs(distanceDifference) * 3.33; // 30 point difference = 0 score
    return Math.max(0, Math.min(100, Math.round(rawScore)));
  };

  /**
   * Clear all heat map data
   */
  const clearHeatMapData = () => {
    dataPointsRef.current = [];
  };

  return {
    getHeatMapBuckets,
    getRawDataPoints,
    getDiscretionScore,
    clearHeatMapData,
    dataPointCount: dataPointsRef.current.length,
  };
}
