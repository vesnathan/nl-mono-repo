"use client";

import { RequireAuth } from "@/components/common/RequireAuth";
import RequireMFA from "@/components/common/RequireMFA";
import { MainLayout } from "@/components/layout/MainLayout/MainLayout";
import {
  SidebarItems,
  mainNavConfig,
} from "@/constants/layout/navigation/navigation";
import { useLogoutFn } from "@/hooks/useLogoutFn";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";

import React, { PropsWithChildren } from "react";

const PFHMainLayout: React.FC<PropsWithChildren> = ({
  children,
  ...sharedLayoutProps
}) => {
  const handleLogout = useLogoutFn();

  useSessionTimeout({
    timeoutDurationMS: 24 * 60 * 60 * 1000,
    handleLogout,
  });

  const getVisibleSidebarItems = (): SidebarItems => {
    return mainNavConfig;
  };

  const renderMainLayoutContent = () => {
    return (
      <MainLayout
        mainNavItems={getVisibleSidebarItems()}
        {...sharedLayoutProps}
      >
        {children}
      </MainLayout>
    );
  };

  return (
    <RequireAuth>
      <RequireMFA>{renderMainLayoutContent()}</RequireMFA>
    </RequireAuth>
  );
};

export default PFHMainLayout;
