"use client";

import { Tooltip, Chip } from "@nextui-org/react";

interface PatreonBadgeProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  variant?: "solid" | "flat" | "bordered";
  tier?: string | null;
  creatorUrl?: string | null;
}

const TIER_COLORS = {
  PLATINUM: "bg-gradient-to-r from-purple-500 to-pink-500",
  GOLD: "bg-yellow-500",
  SILVER: "bg-gray-400",
  BRONZE: "bg-amber-700",
};

const TIER_NAMES = {
  PLATINUM: "Platinum Supporter",
  GOLD: "Gold Supporter",
  SILVER: "Silver Supporter",
  BRONZE: "Bronze Supporter",
};

export function PatreonBadge({
  size = "sm",
  showText = false,
  variant = "flat",
  tier = null,
  creatorUrl = null,
}: PatreonBadgeProps) {
  const tierColor =
    tier && TIER_COLORS[tier as keyof typeof TIER_COLORS]
      ? TIER_COLORS[tier as keyof typeof TIER_COLORS]
      : "bg-[#FF424D]";

  const tooltipContent =
    tier && TIER_NAMES[tier as keyof typeof TIER_NAMES]
      ? TIER_NAMES[tier as keyof typeof TIER_NAMES]
      : "Patreon Supporter";

  // For PLATINUM tier with creator URL, make it clickable
  const isPlatinumWithUrl = tier === "PLATINUM" && creatorUrl;

  const badge = (
    <Chip
      size={size}
      variant={variant}
      className={`${tierColor} text-white font-bold ${isPlatinumWithUrl ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}`}
      onClick={
        isPlatinumWithUrl
          ? (e) => {
              e.stopPropagation();
              window.open(creatorUrl, "_blank", "noopener,noreferrer");
            }
          : undefined
      }
      startContent={
        <svg
          viewBox="0 0 569 546"
          className="w-3 h-3"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="362.589996" cy="204.589996" r="204.589996" />
          <rect width="100" height="545.799988" />
        </svg>
      }
    >
      {showText ? (tier === "PLATINUM" ? "Platinum" : "Patron") : ""}
    </Chip>
  );

  return (
    <Tooltip
      content={
        isPlatinumWithUrl ? (
          <div className="text-center">
            <div>{tooltipContent}</div>
            <div className="text-xs text-gray-300 mt-1">
              Click to visit Patreon page
            </div>
          </div>
        ) : (
          tooltipContent
        )
      }
    >
      {badge}
    </Tooltip>
  );
}
