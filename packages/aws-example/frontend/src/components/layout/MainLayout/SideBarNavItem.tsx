import { cn } from "@nextui-org/react";
import NextLink from "next/link";
import { ReactNode } from "react";

interface SubheaderItem {
  label: string;
  tabValue: string | null;
}

export interface NavItemData {
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
}

interface NavItemProps {
  item: NavItemData;
  collapsed: boolean;
  isActive: boolean;
}

export const NavItem = ({
  isActive,
  item: {
    id,
    isPlaceholder,
    shortTitle,
    title,
    path,
    icon,
    renderWrapper = (node) => node,
  },
  collapsed,
}: NavItemProps) => {
  const renderIcon = () => {
    if (isPlaceholder) {
      return <span className="bg-neutral-100 w-5 h-5" />;
    }
    return <span>{typeof icon === "function" ? icon(isActive) : icon}</span>;
  };

  const renderText = () => {
    if (isPlaceholder) {
      return (
        <span
          className={cn(
            "bg-neutral-100 w-full",
            collapsed ? "h-full" : "self-stretch",
          )}
        />
      );
    }
    return (
      <span
        className={cn(collapsed ? "text-[12px] leading-[30px]" : "text-base")}
      >
        {collapsed && (shortTitle || title)}
        {!collapsed && title}
      </span>
    );
  };

  const renderNavItem = () => {
    return renderWrapper(
      <NextLink href={path} id={id} className={!collapsed ? "w-full px-1" : ""}>
        <div
          className={cn(
            "flex items-center rounded ",
            "font-medium",
            collapsed
              ? "flex-col gap-1 justify-center w-20 h-20 mb-1 "
              : "flex-row gap-3 justify-start w-full h-12 p-5",
            isActive && !isPlaceholder
              ? "bg-primary-500 text-white"
              : "hover:bg-neutral-0 text-neutral-800",
          )}
        >
          {renderIcon()}
          {renderText()}
        </div>
      </NextLink>,
    );
  };

  renderNavItem();

  return <>{renderNavItem()}</>;
};
