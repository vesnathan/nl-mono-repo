"use client";

import { RequireAuth } from "@/components/common/RequireAuth";
import RequireMFA from "@/components/common/RequireMFA";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { Amplify } from "aws-amplify";
import { NextUIProvider } from "@nextui-org/react";
import { useLogoutFn } from "@/hooks/useLogoutFn";
import { GlobalMessage } from "@/components/common/GlobalMessage";
import { QueryProvider } from "@/providers/QueryProvider";
import { Navbar } from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
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
  // All other pages are public by default
  const isProtectedPage =
    pathname?.startsWith("/profile") ||
    pathname?.startsWith("/settings") ||
    pathname?.startsWith("/dashboard");

  const isUnprotectedPage = !isProtectedPage;

  return (
    <html lang="en" data-theme="lemonade">
      <head>
        <title>The Story Hub</title>
        <meta
          name="description"
          content="Collaborative branching storytelling platform"
        />
        <link rel="icon" href="/images/logo-small.png" />
      </head>
      <body>
        <QueryProvider>
          <NextUIProvider>
            <GlobalMessage />
            {isUnprotectedPage ? (
              <div className="flex flex-col min-h-screen">
                <Navbar />
                <main className="flex-grow">{children}</main>
                <Footer />
              </div>
            ) : (
              <RequireAuth>
                <RequireMFA>
                  <div className="flex flex-col min-h-screen">
                    <Navbar />
                    <main className="flex-grow">{children}</main>
                    <Footer />
                  </div>
                </RequireMFA>
              </RequireAuth>
            )}
          </NextUIProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
