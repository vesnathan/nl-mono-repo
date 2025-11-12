import React from "react";
import {
  GameSettings,
  DealerPeekRule,
  BlackjackPayout,
  CountingSystem,
} from "@/types/gameSettings";

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

  const getCountingSystemText = (system: CountingSystem): string => {
    switch (system) {
      case CountingSystem.HI_LO:
        return "Hi-Lo Count";
      case CountingSystem.KO:
        return "KO Count";
      case CountingSystem.HI_OPT_I:
        return "Hi-Opt I Count";
      case CountingSystem.HI_OPT_II:
        return "Hi-Opt II Count";
      case CountingSystem.OMEGA_II:
        return "Omega II Count";
      default:
        return "Hi-Lo Count";
    }
  };

  const mainText = `BLACKJACK PAYS ${getPayoutText(gameSettings.blackjackPayout)}`;
  const subText = `Dealer ${gameSettings.dealerHitsSoft17 ? "Hits" : "Stands"} Soft 17 • ${getPeekRuleText(gameSettings.dealerPeekRule)} • ${gameSettings.numberOfDecks} Deck${gameSettings.numberOfDecks > 1 ? "s" : ""}${gameSettings.insuranceAvailable ? " • Insurance Available" : ""}`;
  const minBetText = "$25 MINIMUM";
  const countingSystemText = getCountingSystemText(gameSettings.countingSystem);

  return (
    <>
      {/* Logo on the table */}
      <img
        src="/logo.png"
        alt="Backroom Blackjack"
        style={{
          position: "absolute",
          top: "calc(20% + 80px)",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "180px",
          height: "180px",
          zIndex: 0,
          pointerEvents: "none",
          opacity: 0.4,
          filter: "drop-shadow(0 4px 8px rgba(0, 0, 0, 0.5))",
        }}
      />
      <svg
        style={{
          position: "absolute",
          top: "45%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "1200px",
          height: "200px",
          zIndex: 0,
          pointerEvents: "none",
        }}
        viewBox="0 0 1200 200"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Arc path for main text - curves upward */}
          <path
            id="mainTextArc"
            d="M 100,100 Q 600,40 1100,100"
            fill="transparent"
          />
          {/* Arc path for subtitle - curves upward below main text */}
          <path
            id="subTextArc"
            d="M 100,130 Q 600,75 1100,130"
            fill="transparent"
          />
          {/* Arc path for minimum bet - curves upward below subtitle */}
          <path
            id="minBetArc"
            d="M 100,155 Q 600,105 1100,155"
            fill="transparent"
          />
          {/* Arc path for counting system - curves upward below minimum bet */}
          <path
            id="countingSystemArc"
            d="M 100,175 Q 600,130 1100,175"
            fill="transparent"
          />
        </defs>

        {/* Main text */}
        <text
          fontFamily="serif"
          fontSize="32"
          fontWeight="bold"
          fill="rgba(255, 215, 0, 0.35)"
          letterSpacing="3"
          style={{
            // eslint-disable-next-line sonarjs/no-duplicate-string
            filter: "drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.6))",
          }}
        >
          <textPath href="#mainTextArc" startOffset="50%" textAnchor="middle">
            {mainText}
          </textPath>
        </text>

        {/* Subtitle text */}
        <text
          fontFamily="serif"
          fontSize="20"
          fontWeight="bold"
          fill="rgba(255, 215, 0, 0.35)"
          letterSpacing="2"
          style={{
            filter: "drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.6))",
          }}
        >
          <textPath href="#subTextArc" startOffset="50%" textAnchor="middle">
            {subText}
          </textPath>
        </text>

        {/* Minimum bet text */}
        <text
          fontFamily="serif"
          fontSize="18"
          fontWeight="bold"
          fill="rgba(255, 215, 0, 0.30)"
          letterSpacing="2"
          style={{
            filter: "drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.6))",
          }}
        >
          <textPath href="#minBetArc" startOffset="50%" textAnchor="middle">
            {minBetText}
          </textPath>
        </text>

        {/* Counting system text */}
        <text
          fontFamily="serif"
          fontSize="16"
          fontWeight="bold"
          fill="rgba(255, 215, 0, 0.25)"
          letterSpacing="2"
          style={{
            filter: "drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.6))",
          }}
        >
          <textPath
            href="#countingSystemArc"
            startOffset="50%"
            textAnchor="middle"
          >
            {countingSystemText}
          </textPath>
        </text>
      </svg>
    </>
  );
}
