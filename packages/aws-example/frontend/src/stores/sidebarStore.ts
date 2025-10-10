import { create } from "zustand";

type SidebarStoreStype = {
  expanded: boolean;
  setExpanded: (open: boolean) => void;
};

export const useSidebarStore = create<SidebarStoreStype>((set) => ({
  expanded: true,
  setExpanded: (open) => set({ expanded: open }),
}));
