"use client";

import { RequireAuth } from "@/components/common/RequireAuth";
import RequireMFA from "@/components/common/RequireMFA";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { Amplify } from "aws-amplify";
import { NextUIProvider } from "@nextui-org/react";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { useLogoutFn } from "@/hooks/useLogoutFn";
import { AMPLIFY_CONFIG } from "../config/amplifyConfig";

const metadata = {
  title: "Cloud Watch Live",
  description: "Live Conference Streaming Software",
};

Amplify.configure(AMPLIFY_CONFIG);

export default function RootLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const handleLogout = useLogoutFn();

  // Handle session timeout globally
  useSessionTimeout({
    timeoutDurationMS: 24 * 60 * 60 * 1000, // 24 hours
    handleLogout,
  });

  const isProtectedPage =
    pathname !== "/login" &&
    pathname !== "/login/" &&
    pathname !== "/logout" &&
    pathname !== "/logout/";

  return (
    <html lang="en" data-theme="lemonade">
      <head>
        <title>{metadata.title}</title>
        <meta name="description" content={metadata.description} />
      </head>
      <body>
        <QueryClientProvider
          client={
            new QueryClient({
              defaultOptions: {
                queries: {
                  retry: false,
                  refetchOnWindowFocus: false,
                },
              },
            })
          }
        >
          <NextUIProvider>
            {!isProtectedPage ? (
              <div>
                <main>{children}</main>
              </div>
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
