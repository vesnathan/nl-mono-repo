/**
 * Local development data provider
 * Falls back to seed data when database is unavailable
 * Uses the shared seed data from backend
 */

import {
  SEED_USERS,
  SEED_STORIES,
  SEED_NODES,
  SEED_COMMENTS,
} from "../seed-data";

// Use the shared seed data from backend
export const LOCAL_DATA = {
  users: SEED_USERS,
  stories: SEED_STORIES.map((story) => ({
    ...story,
    __typename: "Story" as const,
    // Map to frontend format if needed
  })),
  nodes: SEED_NODES.reduce(
    (acc, node) => {
      acc[node.nodeId] = node;
      return acc;
    },
    {} as Record<string, (typeof SEED_NODES)[number]>,
  ),
  comments: SEED_COMMENTS,
};

// Track if we're using local data (either forced or fallback)
let usingLocalData = false;

// Set flag that we're using local data
export function setUsingLocalData() {
  usingLocalData = true;
}

// Check if we should use local data
export function shouldUseLocalData(): boolean {
  return process.env.NEXT_PUBLIC_USE_LOCAL_DATA === "true";
}

// Check if we're currently using local data (forced or fallback)
export function isUsingLocalData(): boolean {
  return process.env.NEXT_PUBLIC_USE_LOCAL_DATA === "true" || usingLocalData;
}

// Get story by ID
export function getStoryById(storyId: string) {
  return LOCAL_DATA.stories.find((s) => s.storyId === storyId) || null;
}

// Get all stories
export function getAllStories() {
  return LOCAL_DATA.stories;
}

// Get comments for a node with pagination support
// Get replies for a comment (recursively includes nested replies)
function getRepliesForComment(
  storyId: string,
  nodeId: string,
  parentCommentId: string,
): any[] {
  const replies = LOCAL_DATA.comments.filter(
    (c) =>
      c.storyId === storyId &&
      c.nodeId === nodeId &&
      c.parentCommentId === parentCommentId,
  );

  // Sort replies by creation time (oldest first for threaded display)
  replies.sort(
    (a, b) => new Date((a as any).createdAt).getTime() - new Date((b as any).createdAt).getTime(),
  );

  // Recursively get nested replies
  return replies.map((reply) => ({
    ...reply,
    replies: getRepliesForComment(storyId, nodeId, reply.commentId),
  }));
}

export function getCommentsForNode(
  storyId: string,
  nodeId: string,
  options?: {
    limit?: number;
    nextToken?: string;
    sortBy?: "NEWEST" | "OLDEST" | "MOST_UPVOTED" | "MOST_REPLIES";
  },
) {
  // Get all top-level comments for this node (depth 0, no parent)
  const comments = LOCAL_DATA.comments.filter(
    (c) =>
      c.storyId === storyId &&
      c.nodeId === nodeId &&
      c.depth === 0 &&
      !c.parentCommentId,
  );

  // Sort comments
  const sortBy = options?.sortBy || "NEWEST";
  switch (sortBy) {
    case "NEWEST":
      comments.sort(
        (a, b) =>
          new Date((b as any).createdAt).getTime() - new Date((a as any).createdAt).getTime(),
      );
      break;
    case "OLDEST":
      comments.sort(
        (a, b) =>
          new Date((a as any).createdAt).getTime() - new Date((b as any).createdAt).getTime(),
      );
      break;
    case "MOST_UPVOTED":
      comments.sort(
        (a, b) => (b.stats?.upvotes || 0) - (a.stats?.upvotes || 0),
      );
      break;
    case "MOST_REPLIES":
      comments.sort(
        (a, b) =>
          (b.stats?.totalReplyCount || 0) - (a.stats?.totalReplyCount || 0),
      );
      break;
    default:
      // Already sorted by NEWEST as default
      break;
  }

  // Add nested replies to each comment
  const commentsWithReplies = comments.map((comment) => ({
    ...comment,
    replies: getRepliesForComment(storyId, nodeId, comment.commentId),
  }));

  // Handle pagination
  const limit = options?.limit || 20;
  const startIndex = options?.nextToken ? parseInt(options.nextToken, 10) : 0;
  const endIndex = startIndex + limit;

  const paginatedComments = commentsWithReplies.slice(startIndex, endIndex);
  const hasMore = endIndex < commentsWithReplies.length;
  const nextToken = hasMore ? endIndex.toString() : null;

  return {
    items: paginatedComments,
    nextToken,
    total: commentsWithReplies.length,
  };
}

// Get node by ID
export function getNodeById(nodeId: string) {
  return LOCAL_DATA.nodes[nodeId] || null;
}

// Get branches (child nodes) for a parent node
export function getBranchesForNode(storyId: string, parentNodeId: string) {
  return Object.values(LOCAL_DATA.nodes).filter(
    (node) => node.storyId === storyId && node.parentNodeId === parentNodeId,
  );
}
