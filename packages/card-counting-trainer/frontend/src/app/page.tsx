"use client";

import { Button } from "@nextui-org/react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-6xl font-bold mb-6 chip-gold drop-shadow-lg">
          Card Counting Trainer
        </h1>

        <p className="text-2xl mb-8 text-gray-200">
          Master the art of card counting in a realistic casino environment
        </p>

        <div className="bg-black/40 backdrop-blur-sm rounded-lg p-8 mb-8">
          <h2 className="text-3xl font-bold mb-4 text-white">
            Welcome to the Underground Casino
          </h2>
          <p className="text-lg text-gray-300 mb-6">
            Practice your card counting skills with realistic gameplay, multiple
            counting systems, and challenging distractions just like in a real
            casino.
          </p>

          <ul className="text-left space-y-3 mb-8 text-gray-200">
            <li className="flex items-start">
              <span className="chip-gold mr-2">♠</span>
              <span>
                Multiple counting systems (Hi-Lo, KO, Hi-Opt I, Hi-Opt II, Omega
                II)
              </span>
            </li>
            <li className="flex items-start">
              <span className="chip-gold mr-2">♥</span>
              <span>Realistic casino distractions and challenges</span>
            </li>
            <li className="flex items-start">
              <span className="chip-gold mr-2">♣</span>
              <span>Multiplayer tables with competitive scoring</span>
            </li>
            <li className="flex items-start">
              <span className="chip-gold mr-2">♦</span>
              <span>Track your progress and improve your skills</span>
            </li>
          </ul>

          {user ? (
            <div className="space-y-4">
              <p className="text-xl text-white mb-4">
                Welcome back, {user.username}!
              </p>
              <div className="flex gap-4 justify-center">
                <Button
                  size="lg"
                  color="warning"
                  variant="shadow"
                  onPress={() => router.push("/game")}
                  className="text-lg font-bold"
                >
                  Start Training
                </Button>
                <Button
                  size="lg"
                  color="default"
                  variant="flat"
                  onPress={() => router.push("/settings")}
                >
                  Settings
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-lg text-gray-300 mb-4">
                Sign up now and get 1,000 free chips to start training!
              </p>
              <div className="flex gap-4 justify-center">
                <Button
                  size="lg"
                  color="warning"
                  variant="shadow"
                  className="text-lg font-bold"
                >
                  Get Started
                </Button>
                <Button size="lg" color="default" variant="flat">
                  Learn More
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="bg-black/30 backdrop-blur-sm rounded-lg p-6">
            <h3 className="text-xl font-bold mb-3 chip-gold">Practice Mode</h3>
            <p className="text-gray-300">
              Learn at your own pace with hints and guidance
            </p>
          </div>
          <div className="bg-black/30 backdrop-blur-sm rounded-lg p-6">
            <h3 className="text-xl font-bold mb-3 chip-gold">Test Mode</h3>
            <p className="text-gray-300">
              Verify your skills without assistance
            </p>
          </div>
          <div className="bg-black/30 backdrop-blur-sm rounded-lg p-6">
            <h3 className="text-xl font-bold mb-3 chip-gold">
              Timed Challenge
            </h3>
            <p className="text-gray-300">
              Race against the clock to improve speed and accuracy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
