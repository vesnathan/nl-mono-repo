"use client";

import React, { PropsWithChildren } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@nextui-org/react";
import { CWLErrorBoundary } from "@/components/common/ErrorBoundary";
import { mainNavConfig } from "@/constants/layout/navigation/navigation";
import {
  MainLayoutSidebar,
  SidebarItems,
  useSidebarWidth,
} from "./MainLayoutSidebar";
import Header from "./Header/Header";

export interface MainLayoutProps extends PropsWithChildren {
  sidebarConfig?: SidebarItems;
  classNames?: {
    mainContainer?: string;
    contentWrapper?: string;
  };
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  sidebarConfig,
  children,
  classNames,
}) => {
  const sidebarWidth = useSidebarWidth();
  const xOffset = sidebarWidth;
  const pathname = usePathname();

  const getVisibleSidebarItems = (): SidebarItems => {
    return sidebarConfig || mainNavConfig;
  };

  const visibleSidebarItems = getVisibleSidebarItems();

  const activeSidebarItem = Object.values(visibleSidebarItems).find((item) => {
    return pathname.startsWith(item.path);
  });

  return (
    <>
      <div>
        <MainLayoutSidebar
          items={visibleSidebarItems}
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
