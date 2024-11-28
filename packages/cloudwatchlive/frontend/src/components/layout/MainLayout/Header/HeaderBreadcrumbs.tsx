import { Divider } from "@nextui-org/react";
import { useSearchParams } from "next/navigation";
import React, { useMemo } from "react";
import { NavItemData } from "../MainLayoutSidebar";

interface HeaderBreadcrumbsProps {
  activeSidebarItem: NavItemData | undefined;
}

const HeaderBreadcrumbs: React.FC<HeaderBreadcrumbsProps> = ({
  activeSidebarItem,
}) => {
  const searchParams = useSearchParams();
  const curTabValue = searchParams.get("tab");

  const subNavItemLabel = useMemo((): string | undefined => {
    if (!activeSidebarItem) return undefined;

    const { subNavItems } = activeSidebarItem;

    if (!subNavItems) return undefined;

    return subNavItems.find((i) => i.tabValue === curTabValue)?.label || "";
  }, [curTabValue, activeSidebarItem]);

  // if not match it could be on the routes that's not from mainNav
  if (!activeSidebarItem) {
    return null;
  }

  return (
    <div className="hidden lg:flex gap-3">
      <span className="text-neutral-900 font-bold">
        {activeSidebarItem.title}
      </span>
      {subNavItemLabel && (
        <>
          <Divider orientation="vertical" className="h-6" />
          <span className="font-semibold">{subNavItemLabel}</span>
        </>
      )}
    </div>
  );
};

export default HeaderBreadcrumbs;
