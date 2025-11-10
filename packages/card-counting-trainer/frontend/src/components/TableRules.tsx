import React from "react";
import { GameSettings, DealerPeekRule, BlackjackPayout } from "@/types/gameSettings";

interface TableRulesProps {
  gameSettings: GameSettings;
}

export default function TableRules({ gameSettings }: TableRulesProps) {
  const getPeekRuleText = (rule: DealerPeekRule): string => {
    switch (rule) {
      case DealerPeekRule.AMERICAN_PEEK:
        return "Dealer Peeks for BJ";
      case DealerPeekRule.EUROPEAN_NO_PEEK:
        return "No Peek";
      case DealerPeekRule.EUROPEAN_NO_HOLE_CARD:
        return "No Hole Card";
      default:
        return "";
    }
  };

  const getPayoutText = (payout: BlackjackPayout): string => {
    switch (payout) {
      case BlackjackPayout.THREE_TO_TWO:
        return "3:2";
      case BlackjackPayout.SIX_TO_FIVE:
        return "6:5";
      case BlackjackPayout.TWO_TO_ONE:
        return "2:1";
      case BlackjackPayout.EVEN_MONEY:
        return "1:1";
      default:
        return "3:2";
    }
  };

  return (
    <div
      style={{
        position: "absolute",
        top: "calc(50% - 20px)",
        left: "50%",
        transform: "translate(-50%, -50%)",
        color: "rgba(255, 215, 0, 0.35)",
        fontSize: "24px",
        fontFamily: "serif",
        fontWeight: "bold",
        textAlign: "center",
        zIndex: 0,
        pointerEvents: "none",
        textShadow: "2px 2px 4px rgba(0, 0, 0, 0.6)",
      }}
    >
      <div style={{ marginBottom: "12px", fontSize: "32px", letterSpacing: "3px" }}>
        BLACKJACK PAYS {getPayoutText(gameSettings.blackjackPayout)}
      </div>
      <div style={{ fontSize: "20px", letterSpacing: "2px" }}>
        Dealer {gameSettings.dealerHitsSoft17 ? "Hits" : "Stands"} Soft 17 • {getPeekRuleText(gameSettings.dealerPeekRule)} • {gameSettings.numberOfDecks} Deck{gameSettings.numberOfDecks > 1 ? "s" : ""}
        {gameSettings.insuranceAvailable && " • Insurance Available"}
      </div>
    </div>
  );
}
