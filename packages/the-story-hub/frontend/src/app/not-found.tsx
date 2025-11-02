"use client";

import { Button } from "@nextui-org/react";
import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-black">
      <div className="max-w-2xl mx-auto px-4 text-center">
        <div className="mb-8">
          <Image
            src="/images/logo.png"
            alt="The Story Hub"
            width={300}
            height={52}
            className="mx-auto mb-8"
          />
        </div>

        <h1 className="text-6xl font-bold text-white mb-4">404</h1>
        <h2 className="text-3xl font-semibold text-gray-300 mb-6">
          Lost in the Story
        </h2>
        <div className="text-xl text-gray-400 mb-8 max-w-lg mx-auto space-y-2 italic">
          <p>You searched for a page, but got a glitch,</p>
          <p>Took a wrong turn at that narrative switch.</p>
          <p>This chapter's blank, the plot's gone astray,</p>
          <p>Time to branch back and find your way!</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/">
            <Button
              size="lg"
              className="bg-purple-600 text-white hover:bg-purple-700 font-semibold px-8"
            >
              Return Home
            </Button>
          </Link>
          <Link href="/browse">
            <Button
              size="lg"
              variant="bordered"
              className="border-white text-white hover:bg-white/10 font-semibold px-8"
            >
              Browse Stories
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
