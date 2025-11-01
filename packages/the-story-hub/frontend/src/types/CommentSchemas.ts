import { z } from "zod";

// Comment Stats Schema
export const CommentStatsSchema = z.object({
  upvotes: z.number().int().min(0).default(0),
  downvotes: z.number().int().min(0).default(0),
  replyCount: z.number().int().min(0).default(0),
  totalReplyCount: z.number().int().min(0).default(0),
});

export type CommentStats = z.infer<typeof CommentStatsSchema>;

// Comment Schema
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const CommentSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    commentId: z.string().uuid(),
    storyId: z.string().uuid(),
    nodeId: z.string().uuid(),
    authorId: z.string(),
    authorName: z.string(),
    content: z.string(),
    parentCommentId: z.string().uuid().nullable().optional(),
    depth: z.number().int().min(0).default(0),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    edited: z.boolean().default(false),
    deleted: z.boolean().optional().default(false),
    stats: CommentStatsSchema.optional(),
    replies: z.array(CommentSchema).optional(),
    replyCount: z.number().int().min(0).optional(),
  }),
);

export type Comment = z.infer<typeof CommentSchema>;

// Comment Connection Schema
export const CommentConnectionSchema = z.object({
  items: z.array(CommentSchema),
  nextToken: z.string().nullable().optional(),
  total: z.number().int().min(0),
});

export type CommentConnection = z.infer<typeof CommentConnectionSchema>;

// Input Schemas
export const CreateCommentInputSchema = z.object({
  storyId: z.string().uuid(),
  nodeId: z.string().uuid(),
  content: z.string().min(1).max(5000),
  parentCommentId: z.string().uuid().optional(),
});

export type CreateCommentInput = z.infer<typeof CreateCommentInputSchema>;

export const UpdateCommentInputSchema = z.object({
  commentId: z.string().uuid(),
  storyId: z.string().uuid(),
  nodeId: z.string().uuid(),
  content: z.string().min(1).max(5000),
});

export type UpdateCommentInput = z.infer<typeof UpdateCommentInputSchema>;

export const DeleteCommentInputSchema = z.object({
  commentId: z.string().uuid(),
  storyId: z.string().uuid(),
  nodeId: z.string().uuid(),
});

export type DeleteCommentInput = z.infer<typeof DeleteCommentInputSchema>;

// Enums
export const CommentVoteType = z.enum(["UPVOTE", "DOWNVOTE", "REMOVE_VOTE"]);
export type CommentVoteType = z.infer<typeof CommentVoteType>;

export const CommentSortBy = z.enum([
  "NEWEST",
  "OLDEST",
  "MOST_UPVOTED",
  "MOST_REPLIES",
]);
export type CommentSortBy = z.infer<typeof CommentSortBy>;
