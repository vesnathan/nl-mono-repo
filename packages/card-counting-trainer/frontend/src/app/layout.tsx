"use client";

import { RequireAuth } from "@/components/common/RequireAuth";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { Amplify } from "aws-amplify";
import { NextUIProvider } from "@nextui-org/react";
import { useLogoutFn } from "@/hooks/useLogoutFn";
import { GlobalMessage } from "@/components/common/GlobalMessage";
import { QueryProvider } from "@/providers/QueryProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { AMPLIFY_CONFIG } from "../config/amplifyConfig";
import "./globals.css";

Amplify.configure(AMPLIFY_CONFIG);

export default function RootLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const handleLogout = useLogoutFn();

  // Handle session timeout globally
  useSessionTimeout({
    timeoutDurationMS: 24 * 60 * 60 * 1000, // 24 hours
    handleLogout,
  });

  // Define protected pages that require authentication
  const isProtectedPage =
    pathname?.startsWith("/profile") ||
    pathname?.startsWith("/settings") ||
    pathname?.startsWith("/game");

  const isUnprotectedPage = !isProtectedPage;

  return (
    <html lang="en" className="dark">
      <head>
        <title>Backroom Blackjack</title>
        <meta
          name="description"
          content="Master card counting in a simulated casino environment"
        />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/logo.png" />
      </head>
      <body className="felt-background">
        <QueryProvider>
          <NextUIProvider>
            <AuthProvider>
              <GlobalMessage />
              {isUnprotectedPage ? (
                <main>{children}</main>
              ) : (
                <RequireAuth>
                  <main>{children}</main>
                </RequireAuth>
              )}
            </AuthProvider>
          </NextUIProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
