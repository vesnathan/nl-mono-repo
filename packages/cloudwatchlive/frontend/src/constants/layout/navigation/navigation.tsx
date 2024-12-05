import { ReactNode } from "react";
import { Icon } from "@iconify/react";

export const LOGIN_PATH = "/login";

interface NavItemData {
  id?: string;
  title: string;
  shortTitle?: string;
  path: string;
  icon: ReactNode | ((isActive: boolean) => ReactNode);
  renderWrapper?: (node: ReactNode) => ReactNode;
}

export interface SidebarItems {
  [key: string]: NavItemData;
}

export const mainNavConfig = {
  dashboard: {
    title: "Dashboard",
    path: "/dashboard",
    icon: () => {
      return <Icon icon="clarity:dashboard-line" />;
    },
  },
  events: {
    title: "Events",
    path: "/events",
    icon: () => {
      return <Icon icon="clarity:calendar-line" />;
    },
  },
} as const satisfies SidebarItems;

export const DEFAULT_REDIRECT_PATH = mainNavConfig.dashboard.path;
