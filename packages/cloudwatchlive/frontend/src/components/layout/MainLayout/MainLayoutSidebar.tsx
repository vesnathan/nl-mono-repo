"use client";

import { useSidebarStore } from "@/stores/sidebarStore";
import { cn } from "@nextui-org/react";
import { ReactNode, useEffect } from "react";
import NextLink from "next/link";
import NextImage from "next/image";
import { useMediaQuery } from "shared/hooks/useMediaQuery";
import ArrowLeftSvg from "../../../assets/images/SVGR/arrowLeftSvg";
import ArrowRightSvg from "../../../assets/images/SVGR/arrowRightSvg";
import CWALogo from "../../../assets/images/logo/logo.png";

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

function NavItem({
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
}: NavItemProps) {
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
      <NextLink href={path} id={id}>
        <div
          className={cn(
            "flex justify-center items-center rounded",
            "font-medium",
            collapsed ? "flex-col gap-1 w-20 h-20 mb-1 " : "gap-3",
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
}

const DRAWER_WIDTH = 240;
const DRAWER_WIDTH_COLLAPSED = 100;
export const useIsMobileLayout = () => {
  // css media queries size are inclusives
  // tailwind uses min-width 1024px for lg: style so reduce one pixel for
  // max-width media queries
  return useMediaQuery(`(max-width: 1023px)`);
};

const useIsForcedCollapsedLayout = () => {
  return useMediaQuery(`(min-width: 1024px) and (max-width: 1536px)`);
};

// for MainLayout to know how much space it need to offset for main content
export const useSidebarWidth = () => {
  const isMobile = useIsMobileLayout();
  const isForcedCollapsed = useIsForcedCollapsedLayout();
  const sidebarExpanded = useSidebarStore((sb) => sb.expanded);
  if (isMobile) {
    return 0;
  }
  if (isForcedCollapsed) {
    return DRAWER_WIDTH_COLLAPSED;
  }
  return sidebarExpanded ? DRAWER_WIDTH : DRAWER_WIDTH_COLLAPSED;
};

export interface SidebarItems {
  [key: string]: NavItemData;
}

interface MainLayoutSidebarProps {
  items: SidebarItems;
  activeSidebarItem: NavItemData | undefined;
}

export function MainLayoutSidebar({
  items,
  activeSidebarItem,
}: MainLayoutSidebarProps) {
  const sidebarExpanded = useSidebarStore((sb) => sb.expanded);
  const setSidebarExpanded = useSidebarStore((sb) => sb.setExpanded);
  const toggleSidebar = () => setSidebarExpanded(!sidebarExpanded);
  const ArrowIcon = sidebarExpanded ? ArrowLeftSvg : ArrowRightSvg;
  const isMobile = useIsMobileLayout();
  const isForcedCollapsed = useIsForcedCollapsedLayout();

  useEffect(() => {
    if (isMobile) {
      setSidebarExpanded(false);
    }
  }, [isMobile, setSidebarExpanded]);

  const showBackdrop = isMobile && sidebarExpanded;

  const renderDrawerContent = () => {
    const collapsed = isForcedCollapsed || (!isMobile && !sidebarExpanded);
    return (
      <nav
        style={{
          width: collapsed ? DRAWER_WIDTH_COLLAPSED : DRAWER_WIDTH,
          transition: "all .2s ease-in-out",
        }}
        className={cn(
          "fixed top-0 bottom-0 bg-white",
          "flex flex-col",
          "border-greyLight border-r",
        )}
      >
        {/* toggle sidebar button */}
        <button
          type="button"
          className={cn(
            "absolute mt-5 right-0 translate-x-[50%]",
            "border-1 border-neutral-100 rounded-lg",
            "bg-white",
            "z-10",
            isForcedCollapsed && "hidden",
          )}
          onClick={toggleSidebar}
        >
          <ArrowIcon
            pathProps={{
              fill: "#14181F",
            }}
          />
        </button>

        {/* logo */}
        <div
          className={cn("relative", "my-4", collapsed ? "mx-[30px]" : "mx-4")}
        >
          <NextImage
            key={`logo-${collapsed}`}
            alt="Logo"
            src={CWALogo}
            width={collapsed ? 38 : 126}
            // height={collapsed ? 38 : 40}
          />
        </div>

        {/* Item list */}
        <div
          className={cn("flex flex-col w-full items-center", "overflow-y-auto")}
        >
          {Object.values(items).map((item) => {
            const isActive = activeSidebarItem?.path === item.path;
            return (
              <NavItem
                key={item.title}
                item={item}
                collapsed={collapsed}
                isActive={isActive}
              />
            );
          })}
        </div>
      </nav>
    );
  };

  const renderPermanentDrawer = () => {
    return renderDrawerContent();
  };

  const renderTemporaryDrawer = () => {
    return (
      <div
        id="temporary-drawer-backdrop"
        role="presentation"
        className={cn(
          "fixed left-0 top-0 w-[100vw] h-[100vh] bg-black bg-opacity-50",
          !showBackdrop && "hidden",
        )}
        onClick={() => toggleSidebar()}
      >
        {renderDrawerContent()}
      </div>
    );
  };

  return (
    <>
      {/* permanent drawer for large screen  */}
      {!isMobile && renderPermanentDrawer()}

      {/* temporary drawer for small screen  */}
      {isMobile && renderTemporaryDrawer()}
    </>
  );
}
