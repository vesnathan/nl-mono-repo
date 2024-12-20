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

interface SidebarItems {
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
  clients: {
    title: "Clients",
    path: "/clients",
    icon: () => {
      return <Icon icon="clarity:users-line" />;
    },
  },
  logout: {
    title: "Log out",
    path: "/logout",
    icon: () => {
      return <Icon icon="clarity:logout-line" />;
    },
  },
} as const satisfies SidebarItems;

export const DEFAULT_REDIRECT_PATH = mainNavConfig.dashboard.path;
