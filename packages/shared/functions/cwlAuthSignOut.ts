import { signOut as amplifySignOut } from "aws-amplify/auth";
import to from "await-to-js";

export async function cwlAuthSignOut() {
  const [amplifySignOutError] = await to(amplifySignOut());
  if (amplifySignOutError) {
    return;
  }
  localStorage.clear();
}
