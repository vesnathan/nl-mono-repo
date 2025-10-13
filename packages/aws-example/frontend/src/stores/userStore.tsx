import { create } from "zustand";
import { AWSEUser } from "@/types/gqlTypes";

const createDefaultAWSEUser = (): AWSEUser => ({
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
  user: AWSEUser;
  setUser: (user: AWSEUser) => void;
};

export const useUserStore = create<UserStoreType>((set) => ({
  user: createDefaultAWSEUser(),
  setUser: (user) => set({ user }),
}));
