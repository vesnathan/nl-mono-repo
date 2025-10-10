"use client";

import { ReactNode } from "react";
import { Amplify } from "aws-amplify";
import { NextUIProvider } from "@nextui-org/react";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { RequireAuth } from "@/components/common/RequireAuth";
import RequireMFA from "@/components/common/RequireMFA";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";
import { useLogoutFn } from "@/hooks/useLogoutFn";
import { GlobalMessage } from "@/components/common/GlobalMessage";
import { AMPLIFY_CONFIG } from "../config/amplifyConfig";
import "./globals.css";

// Configure Amplify once at the app root. Keep AWS infra wired up.
Amplify.configure(AMPLIFY_CONFIG);

export default function RootLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const handleLogout = useLogoutFn();

  // Handle session timeout globally (keeps existing behavior)
  useSessionTimeout({
    timeoutDurationMS: 24 * 60 * 60 * 1000, // 24 hours
    handleLogout,
  });

  const isUnprotectedPage =
    pathname === "/" || pathname === "/login" || pathname === "/login/";

  return (
    <html lang="en">
      <head>
        <title>Cloud Watch Live</title>
        <meta name="description" content="Minimal AWS template with login" />
      </head>
      <body>
        <QueryClientProvider
          client={
            new QueryClient({
              defaultOptions: {
                queries: { retry: false, refetchOnWindowFocus: false },
              },
            })
          }
        >
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
        </QueryClientProvider>
      </body>
    </html>
  );
}
