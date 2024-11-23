import { create } from "zustand";
import {
  CWLUser,
} from "@/graphql/gqlTypes";

const createDefaultCWLUser = (): CWLUser => ({
  __typename: "CWLUser",
  userId: "",
  userEmail: "",
  userFirstName: "",
  userLastName: "",
  userCreated: "",
});

// --------------------user store-----------
type UserStoreType = {
  user: CWLUser;
  setUser: (user: CWLUser) => void;
};

export const useUserStore = create<UserStoreType>((set) => ({
  user: createDefaultCWLUser(),
  setUser: (user) => set({ user }),
}));
