'use client';

import { Button } from '@nextui-org/react';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon = '📭',
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-2xl font-bold text-default-900 mb-2">{title}</h3>
      {description && (
        <p className="text-default-500 max-w-md mb-6">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button color="primary" size="lg" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
