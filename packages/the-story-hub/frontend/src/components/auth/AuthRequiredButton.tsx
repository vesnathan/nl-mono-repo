'use client';

import { useState, ReactNode } from 'react';
import { Button, ButtonProps, Tooltip } from '@nextui-org/react';
import { useAuth } from '@/hooks/useAuth';
import { LoginModal } from './LoginModal';

interface AuthRequiredButtonProps extends Omit<ButtonProps, 'onPress'> {
  onPress?: () => void;
  actionDescription: string;
  children: ReactNode;
}

export function AuthRequiredButton({
  onPress,
  actionDescription,
  children,
  ...buttonProps
}: AuthRequiredButtonProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handlePress = () => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
    } else if (onPress) {
      onPress();
    }
  };

  const button = (
    <Button
      {...buttonProps}
      onPress={handlePress}
      isDisabled={isLoading || buttonProps.isDisabled}
      isLoading={isLoading}
    >
      {children}
    </Button>
  );

  // Show tooltip for unauthenticated users
  if (!isAuthenticated && !isLoading) {
    return (
      <>
        <Tooltip content={`Login required to ${actionDescription}`}>
          {button}
        </Tooltip>
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          actionDescription={actionDescription}
        />
      </>
    );
  }

  return button;
}
