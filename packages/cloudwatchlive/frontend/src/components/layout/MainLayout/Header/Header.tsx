import { cn } from "@nextui-org/react";
import HeaderBreadcrumbs from "./HeaderBreadcrumbs";
import { NavItemData } from "../SideBarNavItem";

interface HeaderProps {
  activeSidebarItem: NavItemData | undefined;
}

const Header = ({ activeSidebarItem }: HeaderProps) => {
  return (
    <nav
      className={cn(
        "bg-white",
        "flex items-center",
        "px-4 md:px-6 lg:px-10",
        "w-full h-[72px] min-h-[72px]",
      )}
    >
      <div className="grow flex items-center ml-4">
        <HeaderBreadcrumbs activeSidebarItem={activeSidebarItem} />
      </div>
    </nav>
  );
};

export default Header;
