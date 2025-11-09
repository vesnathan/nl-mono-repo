import { useEffect } from "react";
import { TrainingMode } from "@/types/gameSettings";

/**
 * Hook to handle timed challenge countdown timer
 * Starts a 5-minute countdown when in TIMED_CHALLENGE mode
 */
export function useTimedChallenge(
  trainingMode: TrainingMode,
  timedChallengeActive: boolean,
  setTimedChallengeActive: (active: boolean) => void,
  timeRemaining: number,
  setTimeRemaining: (time: number | ((prev: number) => number)) => void
) {
  useEffect(() => {
    if (trainingMode === TrainingMode.TIMED_CHALLENGE) {
      if (!timedChallengeActive) {
        // Start the timer
        setTimedChallengeActive(true);
        setTimeRemaining(300); // Reset to 5 minutes
      }

      if (timedChallengeActive && timeRemaining > 0) {
        const timer = setInterval(() => {
          setTimeRemaining((prev) => {
            if (prev <= 1) {
              // Time's up!
              clearInterval(timer);
              // Could show a modal or message here
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        return () => clearInterval(timer);
      }
    } else {
      setTimedChallengeActive(false);
    }
  }, [trainingMode, timedChallengeActive, timeRemaining, setTimedChallengeActive, setTimeRemaining]);
}
