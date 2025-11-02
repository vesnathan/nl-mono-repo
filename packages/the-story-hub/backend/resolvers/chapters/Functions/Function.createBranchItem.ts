/**
 * AppSync Pipeline Function: Create Branch Item in DynamoDB
 * This function creates the branch node using data from the previous function (fetchParentNode).
 */

import { util, Context, AppSyncIdentityCognito } from "@aws-appsync/utils";
import { ChapterNode, CreateBranchInput } from "gqlTypes";

type PrevResult = {
  storyId: string;
  parentChapterNumber: number;
  parentNode: any;
};

type CTX = Context<
  { input: CreateBranchInput },
  object,
  object,
  object,
  ChapterNode
> & { prev: { result: PrevResult } };

export function request(ctx: CTX) {
  const { input } = ctx.args;
  const identity = ctx.identity as AppSyncIdentityCognito;

  // Get data from previous pipeline function
  const { storyId, parentChapterNumber } = ctx.prev.result;

  const nodeId = util.autoId();
  const now = util.time.nowISO8601();
  const nowEpochMillis = util.time.nowEpochMilliSeconds();
  // Add 1 hour (3600000 ms) to current time for editableUntil
  const editableUntilEpoch = nowEpochMillis + 3600000;
  const editableUntil =
    util.time.epochMilliSecondsToISO8601(editableUntilEpoch);

  console.log(
    `Creating branch from node ${input.parentNodeId} in story ${storyId} by user: ${identity.username}`,
  );

  const item = {
    PK: `STORY#${storyId}`,
    SK: `CHAPTER#${nodeId}`,
    GSI1PK: `STORY#${storyId}`,
    GSI1SK: `CHAPTER#${nodeId}`,
    nodeId,
    storyId,
    parentNodeId: input.parentNodeId,
    authorId: identity.username,
    authorName: identity.username, // Will be replaced with screen name from user profile
    content: input.content,
    branchDescription: input.branchDescription,
    paragraphIndex: input.paragraphIndex || null,
    chapterNumber: parentChapterNumber + 1,
    createdAt: now,
    editableUntil,
    stats: {
      reads: 0,
      upvotes: 0,
      downvotes: 0,
      childBranches: 0,
    },
    badges: {
      matchesVision: false,
      authorApproved: false,
    },
  };

  return {
    operation: "PutItem",
    key: util.dynamodb.toMapValues({
      PK: item.PK,
      SK: item.SK,
    }),
    attributeValues: util.dynamodb.toMapValues(item),
  };
}

export function response(ctx: CTX): ChapterNode {
  if (ctx.error) {
    console.error("Error creating branch:", ctx.error);
    return util.error(ctx.error.message, ctx.error.type);
  }

  console.log("Branch created successfully:", ctx.result);
  return ctx.result as ChapterNode;
}
