import { AppSyncIdentityCognito, AppSyncResolverEvent } from "aws-lambda";
import { MutationToSaveSuperAdminClientArgs } from "../../gqlTypes";
export async function handler(
  event: AppSyncResolverEvent<MutationToSaveSuperAdminClientArgs>,
) {
  const { input } = event.arguments;
  const identity = event.identity as AppSyncIdentityCognito;
  console.log("identity", identity);
  console.log("input", input);
  return {
    success: true,
    message: "Successfully saved super admin client",
  };
}