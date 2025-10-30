'use client';

import { Spinner } from '@nextui-org/react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export function LoadingSpinner({ size = 'lg', label = 'Loading...' }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] gap-4">
      <Spinner size={size} />
      {label && <p className="text-default-500">{label}</p>}
    </div>
  );
}
