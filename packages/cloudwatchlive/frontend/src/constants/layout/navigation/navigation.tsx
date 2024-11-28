import { ReactNode } from "react";
import { Icon } from "@iconify/react";

export const LOGIN_PATH = "/login";

type CognitoGroupName =
  | "Admin"
  | "Client"
  | "Registered Attendee"
  | "UnRegistered Attendee";

interface SubheaderItem {
  label: string;
  tabValue: string | null;
  hiddenFromProd?: boolean;
}

interface NavItemData {
  id?: string;
  isPlaceholder?: boolean;
  title: string;
  shortTitle?: string;
  path: string;
  icon: ReactNode | ((isActive: boolean) => ReactNode);
  subNavItems?: SubheaderItem[];
  hidden?: boolean;
  hiddenFromProd?: boolean;
  renderWrapper?: (node: ReactNode) => ReactNode;
  allowedGroups?: CognitoGroupName[];
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
} as const satisfies SidebarItems;

export const DEFAULT_REDIRECT_PATH = mainNavConfig.dashboard.path;
