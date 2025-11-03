/**
 * Zod validation schemas for all GraphQL response types
 * These schemas validate API responses and ensure type safety
 * All schemas are typed to match their corresponding GraphQL types
 */

import { z } from "zod";
import {
  AgeRating,
  VoteType,
  BadgeType,
  NotificationType,
  ClientType,
  type Bookmark as GQLBookmark,
  type ChapterNode as GQLChapterNode,
  type ChapterStats as GQLChapterStats,
  type ChapterBadges as GQLChapterBadges,
  type Story as GQLStory,
  type StoryStats as GQLStoryStats,
  type StoryConnection as GQLStoryConnection,
  type Notification as GQLNotification,
  type NotificationConnection as GQLNotificationConnection,
  type User as GQLUser,
  type UserStats as GQLUserStats,
  type TreeData as GQLTreeData,
  type TreeNode as GQLTreeNode,
} from "./gqlTypes";

// ==================== Chapter Schemas ====================

export const ChapterStatsSchema: z.ZodType<GQLChapterStats> = z.object({
  __typename: z.literal("ChapterStats"),
  reads: z.number().int().min(0),
  upvotes: z.number().int().min(0),
  downvotes: z.number().int().min(0),
  childBranches: z.number().int().min(0),
});

export type ChapterStats = GQLChapterStats;

export const ChapterBadgesSchema: z.ZodType<GQLChapterBadges> = z.object({
  __typename: z.literal("ChapterBadges"),
  authorApproved: z.boolean(),
});

export type ChapterBadges = GQLChapterBadges;

export const ChapterNodeSchema: z.ZodType<GQLChapterNode> = z.object({
  __typename: z.literal("ChapterNode"),
  nodeId: z.string(),
  storyId: z.string(),
  parentNodeId: z.string().nullable().optional(),
  authorId: z.string(),
  authorName: z.string(),
  authorPatreonSupporter: z.boolean().nullable().optional(),
  authorOGSupporter: z.boolean().nullable().optional(),
  content: z.string(),
  branchDescription: z.string().nullable().optional(),
  paragraphIndex: z.number().int().nullable().optional(),
  chapterNumber: z.number().int(),
  aiCreated: z.boolean().nullable().optional(),
  ageRating: z.nativeEnum(AgeRating).nullable().optional(),
  contentWarnings: z.array(z.string()).nullable().optional(),
  maxChildAgeRating: z.nativeEnum(AgeRating).nullable().optional(),
  createdAt: z.string(),
  editableUntil: z.string(),
  stats: ChapterStatsSchema,
  badges: ChapterBadgesSchema,
});

export type ChapterNode = GQLChapterNode;

// ==================== Story Schemas ====================

export const StoryStatsSchema: z.ZodType<GQLStoryStats> = z.object({
  __typename: z.literal("StoryStats"),
  totalBranches: z.number().int().min(0),
  totalReads: z.number().int().min(0),
  totalComments: z.number().int().min(0),
  rating: z.number().min(0).max(5).nullable().optional(),
});

export type StoryStats = GQLStoryStats;

export const StorySchema: z.ZodType<GQLStory> = z.object({
  __typename: z.literal("Story"),
  storyId: z.string().uuid(),
  authorId: z.string(),
  authorName: z.string(),
  authorPatreonSupporter: z.boolean().nullable().optional(),
  authorOGSupporter: z.boolean().nullable().optional(),
  title: z.string(),
  synopsis: z.string(),
  genre: z.array(z.string()),
  ageRating: z.nativeEnum(AgeRating),
  contentWarnings: z.array(z.string()),
  ratingExplanation: z.string().nullable().optional(),
  stats: StoryStatsSchema,
  featured: z.boolean(),
  createdAt: z.string(),
  coverImageUrl: z.string().nullable().optional(),
  rootNodeId: z.string().nullable().optional(),
  aiCreated: z.boolean(),
  allowAI: z.boolean(),
});

export type Story = GQLStory;

export const StoryConnectionSchema: z.ZodType<GQLStoryConnection> = z.object({
  __typename: z.literal("StoryConnection"),
  items: z.array(StorySchema),
  nextToken: z.string().nullable().optional(),
});

export type StoryConnection = GQLStoryConnection;

// ==================== User Schemas ====================

export const UserStatsSchema: z.ZodType<GQLUserStats> = z.object({
  __typename: z.literal("UserStats"),
  storiesCreated: z.number().int().min(0),
  branchesContributed: z.number().int().min(0),
  totalUpvotes: z.number().int().min(0),
});

export type UserStats = GQLUserStats;

export const UserSchema: z.ZodType<GQLUser> = z.object({
  __typename: z.literal("User"),
  userId: z.string(),
  username: z.string(),
  email: z.string().email(),
  bio: z.string().nullable().optional(),
  stats: UserStatsSchema,
  patreonSupporter: z.boolean(),
  ogSupporter: z.boolean(),
  clientType: z.array(z.nativeEnum(ClientType)),
  createdAt: z.string(),
});

export type User = GQLUser;

// ==================== Notification Schemas ====================

export const NotificationSchema: z.ZodType<GQLNotification> = z.object({
  __typename: z.literal("Notification"),
  notificationId: z.string(),
  userId: z.string(),
  type: z.nativeEnum(NotificationType),
  message: z.string(),
  read: z.boolean(),
  relatedStoryId: z.string().nullable().optional(),
  relatedNodeId: z.string().nullable().optional(),
  relatedUserId: z.string().nullable().optional(),
  createdAt: z.string(),
});

export type Notification = GQLNotification;

export const NotificationConnectionSchema: z.ZodType<GQLNotificationConnection> = z.object({
  __typename: z.literal("NotificationConnection"),
  items: z.array(NotificationSchema),
  nextToken: z.string().nullable().optional(),
});

export type NotificationConnection = GQLNotificationConnection;

// ==================== Bookmark Schema ====================

export const BookmarkSchema: z.ZodType<GQLBookmark> = z.object({
  __typename: z.literal("Bookmark"),
  userId: z.string(),
  storyId: z.string(),
  currentNodeId: z.string(),
  breadcrumbs: z.array(z.string()),
  lastRead: z.string(),
});

export type Bookmark = GQLBookmark;

// ==================== Tree Schemas ====================

// TreeNode is recursive, so we need to use z.lazy
export const TreeNodeSchema: z.ZodType<GQLTreeNode> = z.lazy(() =>
  z.object({
    __typename: z.literal("TreeNode"),
    nodeId: z.string(),
    title: z.string(),
    description: z.string().nullable().optional(),
    stats: ChapterStatsSchema,
    badges: ChapterBadgesSchema,
    authorId: z.string(),
    children: z.array(TreeNodeSchema),
  })
);

export type TreeNode = GQLTreeNode;

export const TreeDataSchema: z.ZodType<GQLTreeData> = z.object({
  __typename: z.literal("TreeData"),
  rootNode: TreeNodeSchema,
  totalNodes: z.number().int().min(0),
});

export type TreeData = GQLTreeData;

// ==================== Export all enums for convenience ====================

export { AgeRating, VoteType, BadgeType, NotificationType, ClientType };
