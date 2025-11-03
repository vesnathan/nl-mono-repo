/**
 * Pipeline resolver for Story.authorOGSupporter
 * Step 1: Fetch user's ogSupporter status
 * Step 2: Fetch site settings to check if Patreon supporters should get OG badge
 * Final: Combine both to determine if badge should be shown
 */
import { util, Context } from "@aws-appsync/utils";
import { Story } from "gqlTypes";

type CTX = Context<object, object, object, Story, boolean | null>;

export function request(ctx: CTX) {
  const story = ctx.source;
  const authorId = story?.authorId;

  if (!authorId) {
    return null;
  }

  console.log(`Pipeline: Fetching OG supporter status for author: ${authorId}`);

  // This pipeline will:
  // 1. Fetch user profile (ogSupporter, patreonSupporter)
  // 2. Fetch site settings (grantOGBadgeToPatreonSupporters)
  // 3. Combine results in response function

  return {};
}

export function response(ctx: CTX): boolean | null {
  // No-op for pipeline resolver
  // Actual logic is in the individual functions
  return null;
}
