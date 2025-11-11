import { create } from "zustand";
import { User } from "@/types/gqlTypes";

const createDefaultUser = (): User => ({
  __typename: "AWSEUser",
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
  user: User;
  setUser: (user: User) => void;
};

export const useUserStore = create<UserStoreType>((set) => ({
  user: createDefaultUser(),
  setUser: (user) => set({ user }),
}));
