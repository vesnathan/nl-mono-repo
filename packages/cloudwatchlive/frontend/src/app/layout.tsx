"use client";

import { RequireAuth } from "@/components/common/RequireAuth";
import RequireMFA from "@/components/common/RequireMFA";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { Amplify } from "aws-amplify";
import { NextUIProvider } from "@nextui-org/react";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { AMPLIFY_CONFIG } from "../config/amplifyConfig";
import { useLogoutFn } from "@/hooks/useLogoutFn";

const metadata = {
  title: "Cloud Watch Live",
  description: "Live Conference Streaming Software",
};

const renderMainLayoutContent = (children: ReactNode) => {
  return (
    <div>
      <main>{children}</main>
    </div>
  );
};

Amplify.configure(AMPLIFY_CONFIG);

export default function RootLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const protectedContent = (
    <RequireAuth>
      <RequireMFA>{renderMainLayoutContent(children)}</RequireMFA>
    </RequireAuth>
  );

  const handleLogout = useLogoutFn();

  useSessionTimeout({
    timeoutDurationMS: 24 * 60 * 60 * 1000,
    handleLogout,
  });

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
            {pathname === "/login/" || pathname === "/login"
              ? renderMainLayoutContent(children)
              : protectedContent}
          </NextUIProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
