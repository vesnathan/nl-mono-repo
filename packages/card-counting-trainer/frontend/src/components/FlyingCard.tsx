"use client";

import { useState } from "react";
import { CARD_ANIMATION_DURATION } from "@/constants/animations";

interface FlyingCardProps {
  rank: string;
  suit: string;
  fromPosition: { left: string; top: string };
  toPosition: { left: string; top: string };
  onAnimationComplete?: () => void;
}

export default function FlyingCard({
  _rank,
  _suit,
  fromPosition,
  toPosition,
  onAnimationComplete,
}: FlyingCardProps) {
  const [isFlying, setIsFlying] = useState(true);

  const handleAnimationEnd = () => {
    setIsFlying(false);
    onAnimationComplete?.();
  };

  if (!isFlying) return null;

  return (
    <>
      <div
        style={{
          position: "fixed",
          left: fromPosition.left,
          top: fromPosition.top,
          width: "70px",
          height: "98px",
          zIndex: 9999,
          animation: `fly-to-position ${CARD_ANIMATION_DURATION}ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`,
          pointerEvents: "none",
        }}
        onAnimationEnd={handleAnimationEnd}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            backgroundImage: "url(/assets/images/back.webp)",
            backgroundSize: "100% 100%",
            borderRadius: "4px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
          }}
        />
      </div>
      <style jsx>{`
        @keyframes fly-to-position {
          0% {
            left: ${fromPosition.left};
            top: ${fromPosition.top};
            transform: scale(0.8) rotate(0deg);
            opacity: 0.8;
          }
          50% {
            transform: scale(1.1) rotate(5deg);
            opacity: 1;
          }
          100% {
            left: ${toPosition.left};
            top: ${toPosition.top};
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}
