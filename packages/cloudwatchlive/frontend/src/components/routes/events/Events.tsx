import { Modal, ModalBody, ModalContent } from "@nextui-org/react";
import React from "react";
import type { ModalProps } from "@nextui-org/modal";

const ModalAny = Modal as unknown as React.ComponentType<ModalProps>;

export const Events = () => {
  return (
    <ModalAny isOpen>
      <ModalContent>
        <ModalBody>
          <h1>Events</h1>
        </ModalBody>
      </ModalContent>
    </ModalAny>
  );
};
