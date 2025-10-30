'use client';

import { Card, CardBody, Button } from '@nextui-org/react';

interface ErrorMessageProps {
  title?: string;
  message: string;
  retry?: () => void;
}

export function ErrorMessage({ 
  title = 'Error', 
  message, 
  retry 
}: ErrorMessageProps) {
  return (
    <Card className="max-w-md mx-auto">
      <CardBody className="text-center gap-4">
        <div className="text-4xl">⚠️</div>
        <h3 className="text-xl font-bold text-danger">{title}</h3>
        <p className="text-default-600">{message}</p>
        {retry && (
          <Button color="primary" onClick={retry}>
            Try Again
          </Button>
        )}
      </CardBody>
    </Card>
  );
}
