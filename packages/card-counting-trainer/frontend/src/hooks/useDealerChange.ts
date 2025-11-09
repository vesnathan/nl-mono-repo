import { useEffect } from "react";
import { DealerCharacter, getRandomDealer } from "@/data/dealerCharacters";

/**
 * Hook to handle automatic dealer changes after a set interval of shoes
 */
export function useDealerChange(
  shoesDealt: number,
  dealerChangeInterval: number,
  currentDealer: DealerCharacter | null,
  setCurrentDealer: (dealer: DealerCharacter) => void
) {
  useEffect(() => {
    if (shoesDealt > 0 && shoesDealt % dealerChangeInterval === 0) {
      const newDealer = getRandomDealer(
        currentDealer ? [currentDealer.id] : []
      );
      setCurrentDealer(newDealer);
    }
  }, [shoesDealt, dealerChangeInterval, currentDealer, setCurrentDealer]);
}
