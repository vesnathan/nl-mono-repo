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

  const isUnprotectedPage =
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/login/" ||
    // Allow public access to browse stories
    pathname?.startsWith("/browse") ||
    // Allow public access to read stories
    pathname?.startsWith("/story");

  return (
    <html lang="en" data-theme="lemonade">
      <head>
        <title>The Story Hub</title>
        <meta name="description" content="Collaborative branching storytelling platform" />
      </head>
      <body>
        <QueryProvider>
          <NextUIProvider>
            <GlobalMessage />
            {isUnprotectedPage ? (
              <div>{children}</div>
            ) : (
              <RequireAuth>
                <RequireMFA>
                  <main>{children}</main>
                </RequireMFA>
              </RequireAuth>
            )}
          </NextUIProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
