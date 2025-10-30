import { util, Context, AppSyncIdentityCognito } from "@aws-appsync/utils";
import { ChapterNode, AwardBadgeInput, BadgeType } from "gqlTypes";

type CTX = Context<
  { input: AwardBadgeInput },
  object,
  object,
  object,
  ChapterNode
>;

export function request(ctx: CTX) {
  const { input } = ctx.args;
  const identity = ctx.identity as AppSyncIdentityCognito;

  console.log(`User ${identity.username} awarding ${input.badgeType} badge to chapter ${input.nodeId}`);

  // TODO: Verify user is story author or has permission to award badges
  // This would require fetching the story first in a pipeline resolver

  const badgeField = input.badgeType === BadgeType.MATCHES_VISION
    ? "matchesVision"
    : "authorApproved";

  return {
    operation: "UpdateItem",
    key: util.dynamodb.toMapValues({
      PK: `STORY#${input.storyId}`,
      SK: `CHAPTER#${input.nodeId}`,
    }),
    update: {
      expression: `SET #badges.#${badgeField} = :true`,
      expressionNames: {
        "#badges": "badges",
        [`#${badgeField}`]: badgeField,
      },
      expressionValues: util.dynamodb.toMapValues({
        ":true": true,
      }),
    },
  };
}

export function response(ctx: CTX): ChapterNode {
  if (ctx.error) {
    console.error("Error awarding badge:", ctx.error);
    return util.error(ctx.error.message, ctx.error.type);
  }

  console.log("Badge awarded successfully");
  return ctx.result as ChapterNode;
}
