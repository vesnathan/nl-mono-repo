import { signOut as amplifySignOut } from "aws-amplify/auth";
import to from "await-to-js";

export async function authSignOut() {
  const [amplifySignOutError] = await to(amplifySignOut());
  if (amplifySignOutError) {
    return;
  }
  localStorage.clear();
}
