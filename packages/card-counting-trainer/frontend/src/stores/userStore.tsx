import { create } from "zustand";
import { User } from "@/types/gqlTypes";

const createDefaultUser = (): User => ({
  __typename: "User",
  id: "",
  email: "",
  username: "",
  chips: 1000,
  totalChipsPurchased: 0,
  patreonInfo: null,
  earlyAdopter: false,
  createdAt: "",
  updatedAt: "",
});

type UserStoreType = {
  user: User;
  setUser: (user: User) => void;
  isAdmin: boolean;
  setIsAdmin: (isAdmin: boolean) => void;
};

export const useUserStore = create<UserStoreType>((set) => ({
  user: createDefaultUser(),
  setUser: (user) => set({ user }),
  isAdmin: false,
  setIsAdmin: (isAdmin) => set({ isAdmin }),
}));
