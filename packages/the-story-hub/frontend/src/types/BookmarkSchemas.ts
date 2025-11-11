import { z } from "zod";
import type { Bookmark as GQLBookmark } from "./gqlTypes";

export const BookmarkSchema: z.ZodType<GQLBookmark> = z.object({
  __typename: z.literal("Bookmark").optional(),
  userId: z.string(),
  storyId: z.string(),
  currentNodeId: z.string(),
  breadcrumbs: z.array(z.string()),
  lastRead: z.string(),
}) as z.ZodType<GQLBookmark>;

export type Bookmark = GQLBookmark;
