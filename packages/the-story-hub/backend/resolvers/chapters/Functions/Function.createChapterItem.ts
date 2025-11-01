import { util, Context, AppSyncIdentityCognito } from "@aws-appsync/utils";
import { ChapterNode, CreateChapterInput } from "gqlTypes";

type CTX = Context<
  { input: CreateChapterInput },
  object,
  object,
  object,
  ChapterNode
>;

export function request(ctx: CTX) {
  const { input } = ctx.args;
  const identity = ctx.identity as AppSyncIdentityCognito;

  const nodeId = util.autoId();
  const now = util.time.nowISO8601();
  const nowEpochMillis = util.time.nowEpochMilliSeconds();
  // Add 1 hour (3600000 ms) to current time for editableUntil
  const editableUntilEpoch = nowEpochMillis + 3600000;
  const editableUntil =
    util.time.epochMilliSecondsToISO8601(editableUntilEpoch);

  console.log(
    `Creating chapter for story ${input.storyId} by user: ${identity.username}`,
  );

  return {
    operation: "PutItem",
    key: util.dynamodb.toMapValues({
      PK: `STORY#${input.storyId}`,
      SK: `CHAPTER#${nodeId}`,
    }),
    attributeValues: util.dynamodb.toMapValues({
      nodeId,
      storyId: input.storyId,
      parentNodeId: null,
      authorId: identity.username,
      content: input.content,
      branchDescription: null,
      paragraphIndex: null,
      chapterNumber: input.chapterNumber,
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
      // GSI1 for user's branches
      GSI1PK: `USER#${identity.username}`,
      GSI1SK: `BRANCH#${now}#${nodeId}`,
    }),
  };
}

export function response(ctx: CTX) {
  if (ctx.error) {
    console.error("Error creating chapter:", ctx.error);
    return util.error(ctx.error.message, ctx.error.type);
  }

  console.log("Chapter created successfully:", ctx.result);

  // Pass chapter data to next function
  return {
    chapter: ctx.result,
    isFirstChapter: ctx.args.input.chapterNumber === 1,
  };
}
