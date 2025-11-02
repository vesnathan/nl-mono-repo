"use client";

import { Tooltip, Chip } from "@nextui-org/react";

interface OGBadgeProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  variant?: "solid" | "flat" | "bordered";
}

export function OGBadge({
  size = "sm",
  showText = false,
  variant = "flat",
}: OGBadgeProps) {
  return (
    <Tooltip content="Early Supporter - One of the first patrons!">
      <Chip
        size={size}
        variant={variant}
        className="bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold"
      >
        {showText ? "⭐ OG" : "⭐"}
      </Chip>
    </Tooltip>
  );
}
