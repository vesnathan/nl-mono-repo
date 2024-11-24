import { signOut as amplifySignOut } from "aws-amplify/auth";

export async function cwlAuthSignOut() {
  console.log("cwlAuthSignOut")
  await amplifySignOut();
  localStorage.clear();
}
