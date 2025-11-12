"use client";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@nextui-org/react";

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WelcomeModal({ isOpen, onClose }: WelcomeModalProps) {
  const handleStartGame = () => {
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      isDismissable={false}
      hideCloseButton
      classNames={{
        base: "bg-gray-900 border border-casino-gold/30",
        header: "border-b border-casino-gold/30",
        body: "py-6",
        footer: "border-t border-casino-gold/30",
      }}
    >
      <ModalContent className="bg-gray-900 border border-casino-gold/30">
        <ModalHeader className="flex flex-col items-center gap-4 text-white pt-6">
          <img
            src="/logo.png"
            alt="Backroom Blackjack"
            className="w-40 h-40 mb-2"
          />
          <h2 className="text-3xl font-bold chip-gold text-center">
            Welcome to Backroom Blackjack!
          </h2>
        </ModalHeader>
        <ModalBody className="text-center">
          <div className="space-y-4">
            <p className="text-white text-lg leading-relaxed">
              Master the art of card counting in a realistic casino environment.
              Practice your skills, manage dealer suspicion, and beat the house!
            </p>

            <div className="bg-gray-800/50 rounded-lg p-4 border border-casino-gold/20 text-center">
              <p className="text-gray-300 text-base mb-3">
                Enjoying the game? Support us on Patreon to help keep
                development going!
              </p>
              <a
                href="https://www.patreon.com/backrealmblackjack"
                target="_blank"
                rel="noopener noreferrer"
                className="text-casino-gold hover:text-yellow-300 font-semibold underline inline-block"
              >
                Support us on Patreon
              </a>
            </div>

            <p className="text-white text-2xl font-bold chip-gold mt-6">
              Have Fun!
            </p>
          </div>
        </ModalBody>
        <ModalFooter className="flex justify-center">
          <Button
            className="w-full max-w-md bg-casino-gold hover:bg-yellow-600 text-black font-bold text-lg py-6"
            onPress={handleStartGame}
            size="lg"
          >
            Start Playing
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
