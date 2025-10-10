import { create } from "zustand";
import { awsbUser } from "@/types/gqlTypes";

const createDefaultawsbUser = (): awsbUser => ({
  __typename: "awsbUser",
  userId: "",
  userEmail: "",
  userFirstName: "",
  userLastName: "",
  userCreated: "",
  organizationId: "",
  privacyPolicy: false,
  termsAndConditions: false,
  userAddedById: "",
  clientType: [],
  userTitle: "",
  userPhone: "",
  userRole: "",
});

// --------------------user store-----------
type UserStoreType = {
  user: awsbUser;
  setUser: (user: awsbUser) => void;
};

export const useUserStore = create<UserStoreType>((set) => ({
  user: createDefaultawsbUser(),
  setUser: (user) => set({ user }),
}));
