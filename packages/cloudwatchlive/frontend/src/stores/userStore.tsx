import { create } from "zustand";
import { ClientType, CWLUser } from "@/graphql/gqlTypes";

const createDefaultCWLUser = (): CWLUser => ({
  __typename: "CWLUser",
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
  user: CWLUser;
  setUser: (user: CWLUser) => void;
  userGroups: string[];
  setUserGroups: (userGroups: ClientType[]) => void;
};

export const useUserStore = create<UserStoreType>((set) => ({
  user: createDefaultCWLUser(),
  setUser: (user) => set({ user }),
  userGroups: [],
  setUserGroups: (userGroups) => set((state) => ({ ...state, userGroups })),
}));
