"use client";

import RequireAuth from "@/components/common/RequireAuth";
import RequireMFA from "@/components/common/RequireMFA";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";
import { usePathname } from "next/navigation";

const metadata = {
  title: 'Conference Watch Live',
  description: 'Live Conference Streaming Software',
};

const renderMainLayoutContent = (children: React.ReactNode) => {
  return (
    <div>
      <main>
        {children}
      </main>
    </div>
  );
};


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const protectedContent = (
    <RequireAuth>
      <RequireMFA>{renderMainLayoutContent(children)}</RequireMFA>
    </RequireAuth>
  );
  
  useSessionTimeout(30 * 60 * 1000);

  return (
    <html lang="en">
      <head>
        <title>{metadata.title}</title>
        <meta name="description" content={metadata.description} />
      </head>
      <body>
        {pathname === "/login" ? renderMainLayoutContent(children) : protectedContent}
      </body>
    </html>
  );
}

