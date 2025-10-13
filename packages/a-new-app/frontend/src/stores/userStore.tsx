import { create } from "zustand";
import { ANAUser } from "@/types/gqlTypes";

const createDefaultANAUser = (): ANAUser => ({
  __typename: "ANAUser",
  userId: "",
  userEmail: "",
  userFirstName: "",
  userLastName: "",
  userCreated: "",
  privacyPolicy: false,
  termsAndConditions: false,
  userAddedById: "",
  clientType: [],
  userTitle: "",
  userPhone: "",
});

// --------------------user store-----------
type UserStoreType = {
  user: ANAUser;
  setUser: (user: ANAUser) => void;
};

export const useUserStore = create<UserStoreType>((set) => ({
  user: createDefaultANAUser(),
  setUser: (user) => set({ user }),
}));
