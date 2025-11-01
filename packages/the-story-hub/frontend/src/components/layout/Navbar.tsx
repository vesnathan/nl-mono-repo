"use client";

import { Button } from "@nextui-org/react";
import Link from "next/link";
import Image from "next/image";

export function Navbar() {
  return (
    <nav className="sticky top-0 left-0 right-0 z-30 bg-[#21271C]">
      <div className="px-6 py-4">
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center">
            <Image
              src="/images/logo-small.png"
              alt="The Story Hub"
              width={50}
              height={50}
              priority
            />
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button
                variant="ghost"
                className="text-white border-white hover:bg-white/20"
              >
                Login
              </Button>
            </Link>
            <Link href="/register">
              <Button className="bg-[#422F9F] hover:bg-[#2162BF] text-white">
                Register
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
