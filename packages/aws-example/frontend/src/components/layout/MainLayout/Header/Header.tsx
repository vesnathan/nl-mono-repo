"use client";

import { cn } from "@nextui-org/react";
import { useSidebarStore } from "@/stores/sidebarStore";
import { useIsMobileLayout } from "../MainLayoutSidebar";
import HeaderBreadcrumbs from "./HeaderBreadcrumbs";
import { NavItemData } from "../SideBarNavItem";

interface HeaderProps {
  activeSidebarItem: NavItemData | undefined;
}

const Header = ({ activeSidebarItem }: HeaderProps) => {
  const isMobile = useIsMobileLayout();
  const setSidebarExpanded = useSidebarStore((sb) => sb.setExpanded);

  const handleMenuClick = () => {
    setSidebarExpanded(true);
  };

  return (
    <nav
      className={cn(
        "bg-white",
        "flex items-center",
        "px-4 md:px-6 lg:px-10",
        "w-full h-[72px] min-h-[72px]",
      )}
    >
      {isMobile && (
        <button
          type="button"
          onClick={handleMenuClick}
          className={cn(
            "flex items-center justify-center",
            "w-10 h-10",
            "mr-4",
            "hover:bg-neutral-100 rounded-lg",
            "transition-colors",
          )}
          aria-label="Open menu"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      )}
      <div className="grow flex items-center ml-4">
        <HeaderBreadcrumbs activeSidebarItem={activeSidebarItem} />
      </div>
    </nav>
  );
};

export default Header;
