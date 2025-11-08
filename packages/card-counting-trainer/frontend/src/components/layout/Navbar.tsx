"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@nextui-org/react";
import Link from "next/link";
import { AuthModal } from "@/components/auth/AuthModal";
import { useAuth } from "@/contexts/AuthContext";
import { signOut } from "aws-amplify/auth";
import { useRouter } from "next/navigation";

export function Navbar() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { isAuthenticated, isLoading, user, refresh } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
    await refresh();
    setShowDropdown(false);
    router.push("/");
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    const displayName = user?.username;
    if (!displayName) return "?";
    const names = displayName.split(" ");
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return displayName.substring(0, 2).toUpperCase();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
    return undefined;
  }, [showDropdown]);

  return (
    <>
      <nav className="sticky top-0 left-0 right-0 z-30 bg-black/50 backdrop-blur-md border-b border-casino-gold/20">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold chip-gold">
                Card Counting Trainer
              </span>
            </Link>
            <div className="flex items-center gap-4">
              {!isLoading &&
                (isAuthenticated ? (
                  <div className="relative" ref={dropdownRef}>
                    <button
                      type="button"
                      onClick={() => setShowDropdown(!showDropdown)}
                      className="w-12 h-12 rounded-full bg-gradient-to-br from-casino-gold to-yellow-600 flex items-center justify-center text-black font-bold hover:scale-110 transition-transform cursor-pointer"
                    >
                      {getUserInitials()}
                    </button>

                    {showDropdown && (
                      <div className="absolute right-0 mt-2 w-64 bg-gray-900 border border-casino-gold/30 rounded-lg shadow-lg overflow-hidden z-50">
                        <div className="px-4 py-3 border-b border-casino-gold/30">
                          <p className="text-sm font-semibold text-white">
                            Signed in as
                          </p>
                          <p className="text-xs text-gray-400">
                            {user?.username || "Loading..."}
                          </p>
                        </div>
                        <div className="py-1">
                          <button
                            type="button"
                            onClick={() => {
                              router.push("/settings");
                              setShowDropdown(false);
                            }}
                            className="w-full px-4 py-2 text-left text-white hover:bg-gray-800 transition-colors"
                          >
                            Settings
                          </button>
                          <button
                            type="button"
                            onClick={handleLogout}
                            className="w-full px-4 py-2 text-left text-red-500 hover:bg-gray-800 transition-colors"
                          >
                            Logout
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <Button
                    className="bg-casino-gold hover:bg-yellow-600 text-black font-bold"
                    onPress={() => setShowAuthModal(true)}
                  >
                    Login / Register
                  </Button>
                ))}
            </div>
          </div>
        </div>
      </nav>
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={refresh}
      />
    </>
  );
}
