"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { cn } from "@nextui-org/react";
import { CWLErrorBoundary } from "@/components/common/ErrorBoundary";
import {
  MainLayoutSidebar,
  SidebarItems,
  useSidebarWidth,
} from "./MainLayoutSidebar";
import Header from "./Header/Header";

export interface MainLayoutProps {
  // sidebar props
  mainNavItems: SidebarItems;

  // content props
  children: React.ReactNode;

  // style override
  classNames?: {
    mainContainer?: string;
    contentWrapper?: string;
  };
}

export const MainLayout = ({
  // sidebar
  mainNavItems,

  // content
  children,

  // style override
  classNames,
}: MainLayoutProps) => {
  const sidebarWidth = useSidebarWidth();
  const xOffset = sidebarWidth;
  const pathname = usePathname();
  const activeSidebarItem = Object.values(mainNavItems).find((item) => {
    return pathname.startsWith(item.path);
  });

  return (
    <>
      <div>
        <MainLayoutSidebar
          items={mainNavItems}
          activeSidebarItem={activeSidebarItem}
        />
      </div>
      <div
        data-testid="main-container"
        style={{
          paddingLeft: xOffset,
        }}
        className={cn(
          "bg-neutral-100",
          "w-full min-h-dvh",
          "flex flex-col",
          classNames?.mainContainer,
        )}
      >
        <Header activeSidebarItem={activeSidebarItem} />

        <div
          className={cn(
            "relative grow",

            `
                p-0
                md:p-5
                lg:p-6
                xl:p-10
              `,
            classNames?.contentWrapper,
          )}
        >
          <CWLErrorBoundary>{children}</CWLErrorBoundary>
        </div>
      </div>
    </>
  );
};
