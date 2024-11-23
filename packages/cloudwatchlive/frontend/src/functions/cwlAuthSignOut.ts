import { signOut as amplifySignOut } from "aws-amplify/auth";

export async function cwlAuthSignOut() {
    await amplifySignOut();
  localStorage.clear();
}
