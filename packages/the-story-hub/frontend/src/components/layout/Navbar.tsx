"use client";

import { useState } from "react";
import { Button } from "@nextui-org/react";
import Link from "next/link";
import Image from "next/image";
import { LoginModal } from "@/components/auth/LoginModal";
import { useAuth } from "@/hooks/useAuth";
import { authSignOut } from "shared/functions/authSignOut";

export function Navbar() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { isAuthenticated, isLoading } = useAuth();

  const handleLogout = async () => {
    await authSignOut();
    window.location.reload();
  };

  return (
    <>
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
              {!isLoading &&
                (isAuthenticated ? (
                  <Button
                    variant="ghost"
                    className="text-white border-white hover:bg-white/20"
                    onPress={handleLogout}
                  >
                    Logout
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      className="text-white border-white hover:bg-white/20"
                      onPress={() => setShowLoginModal(true)}
                    >
                      Login
                    </Button>
                    <Link href="/register">
                      <Button className="bg-[#422F9F] hover:bg-[#2162BF] text-white">
                        Register
                      </Button>
                    </Link>
                  </>
                ))}
            </div>
          </div>
        </div>
      </nav>
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </>
  );
}
