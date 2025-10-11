import { create } from "zustand";
import { AWSBUser } from "@/types/gqlTypes";

const createDefaultAWSBUser = (): AWSBUser => ({
  __typename: "AWSBUser",
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
  user: AWSBUser;
  setUser: (user: AWSBUser) => void;
};

export const useUserStore = create<UserStoreType>((set) => ({
  user: createDefaultAWSBUser(),
  setUser: (user) => set({ user }),
}));
