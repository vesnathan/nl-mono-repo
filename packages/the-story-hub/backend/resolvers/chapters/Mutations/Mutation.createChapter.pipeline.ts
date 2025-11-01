import { Context } from "@aws-appsync/utils";
import { ChapterNode } from "gqlTypes";

type CTX = Context<any, object, object, object, ChapterNode>;

// Before function - passes through to first pipeline function
export function request(ctx: CTX) {
  return {};
}

// After function - returns the created chapter
export function response(ctx: CTX): ChapterNode {
  const chapter = ctx.prev.result;

  console.log(`Pipeline returning created chapter: ${chapter.nodeId}`);

  return chapter as ChapterNode;
}
