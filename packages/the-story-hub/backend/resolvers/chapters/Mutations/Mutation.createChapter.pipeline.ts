import { Context } from "@aws-appsync/utils";
import { ChapterNode } from "gqlTypes";

type CTX = Context<any, object, object, object, ChapterNode>;

// Before function - passes through to first pipeline function
export function request(ctx: CTX) {
  return {};
}

// After function - returns the created chapter
export function response(ctx: CTX): ChapterNode {
  // TODO: Fix type - ctx.prev.result should be typed properly
  const chapter = (ctx.prev as any).result;

  console.log(`Pipeline returning created chapter: ${chapter.nodeId}`);

  return chapter as ChapterNode;
}
