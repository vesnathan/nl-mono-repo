import { Chip, Tooltip } from "@nextui-org/react";

interface AuthorBadgeProps {
  size?: "sm" | "md" | "lg";
}

export function AuthorBadge({ size = "sm" }: AuthorBadgeProps) {
  return (
    <Tooltip content="Original Author">
      <Chip
        size={size}
        variant="flat"
        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold px-2"
      >
        Author
      </Chip>
    </Tooltip>
  );
}
