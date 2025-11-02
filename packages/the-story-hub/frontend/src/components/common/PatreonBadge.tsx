"use client";

import { Tooltip, Chip } from "@nextui-org/react";

interface PatreonBadgeProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  variant?: "solid" | "flat" | "bordered";
}

export function PatreonBadge({
  size = "sm",
  showText = false,
  variant = "flat",
}: PatreonBadgeProps) {
  return (
    <Tooltip content="Patreon Supporter">
      <Chip
        size={size}
        variant={variant}
        className="bg-[#FF424D] text-white font-bold"
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
        {showText ? "Patron" : ""}
      </Chip>
    </Tooltip>
  );
}
