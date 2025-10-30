import { create } from "zustand";
import { User } from "@/types/gqlTypes";

const createDefaultUser = (): User => ({
  __typename: "User",
  userId: "",
  username: "",
  email: "",
  bio: "",
  stats: {
    __typename: "UserStats",
    storiesCreated: 0,
    branchesContributed: 0,
    totalUpvotes: 0,
  },
  patreonSupporter: false,
  clientType: [],
  createdAt: "",
});

// --------------------user store-----------
type UserStoreType = {
  user: User;
  setUser: (user: User) => void;
};

export const useUserStore = create<UserStoreType>((set) => ({
  user: createDefaultUser(),
  setUser: (user) => set({ user }),
}));
