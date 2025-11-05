"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@nextui-org/react";
import Link from "next/link";
import Image from "next/image";
import { LoginModal } from "@/components/auth/LoginModal";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useUserStore } from "@/stores/userStore";
import { authSignOut } from "shared/functions/authSignOut";
import { useRouter } from "next/navigation";

export function Navbar() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { isAuthenticated, isLoading, refresh, username } = useAuth();
  const user = useUserStore((state) => state.user);
  const { isAdmin, isLoading: isAdminLoading } = useIsAdmin();
  const router = useRouter();

  const handleLogout = async () => {
    await authSignOut();
    await refresh();
    setShowDropdown(false);
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    // Use username from auth context as fallback since userStore might not be loaded yet
    const displayName = user?.username || username;
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
  }, [showDropdown]);

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
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setShowDropdown(!showDropdown)}
                      className="w-12 h-12 rounded-full bg-gradient-to-br from-[#422F9F] to-[#2162BF] flex items-center justify-center text-white font-semibold hover:scale-110 transition-transform cursor-pointer"
                    >
                      {getUserInitials()}
                    </button>

                    {showDropdown && (
                      <div className="absolute right-0 mt-2 w-64 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg shadow-lg overflow-hidden z-50">
                        <div className="px-4 py-3 border-b border-[#3a3a3a]">
                          <p className="text-sm font-semibold text-white">
                            Signed in as
                          </p>
                          <p className="text-xs text-gray-400">
                            {user?.email ||
                              user?.username ||
                              username ||
                              "Loading..."}
                          </p>
                        </div>
                        <div className="py-1">
                          <button
                            onClick={() => {
                              router.push("/settings");
                              setShowDropdown(false);
                            }}
                            className="w-full px-4 py-2 text-left text-white hover:bg-[#3a3a3a] transition-colors"
                          >
                            Settings
                          </button>
                          {!isAdminLoading && isAdmin && (
                            <button
                              onClick={() => {
                                router.push("/admin/settings");
                                setShowDropdown(false);
                              }}
                              className="w-full px-4 py-2 text-left text-white hover:bg-[#3a3a3a] transition-colors"
                            >
                              Admin Settings
                            </button>
                          )}
                          <button
                            onClick={handleLogout}
                            className="w-full px-4 py-2 text-left text-red-500 hover:bg-[#3a3a3a] transition-colors"
                          >
                            Logout
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
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
        onLoginSuccess={refresh}
      />
    </>
  );
}
