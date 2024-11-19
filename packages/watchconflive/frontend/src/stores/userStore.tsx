import { create } from "zustand";
import {
  CWLUserFragment,
  OnboardingProgressFragment,
} from "@/graphql/gqlTypes";

const createDefaultCWLUser = (): CWLUserFragment => ({
  __typename: "CWLUser",
  userId: "",
  userEmail: "",
  cognitoUserGroups: [],
  userFirstName: "",
  userLastName: "",
  doNotDisturb: "0",
});

// --------------------user store-----------
type UserStoreType = {
  user: CWLUserFragment;
  setUser: (user: CWLUserFragment) => void;
};

export const useUserStore = create<UserStoreType>((set) => ({
  user: createDefaultCWLUser(),
  setUser: (user) => set({ user }),
}));

export type OnboardingStatus = Omit<OnboardingProgressFragment, "__typename">;
const defaultOnboardingStatus: OnboardingStatus = {};
export const useUserOnboardingProgress = (): OnboardingStatus => {
  return useUserStore(
    (userStore) => userStore.user.onboardingProgress || defaultOnboardingStatus,
  );
};
