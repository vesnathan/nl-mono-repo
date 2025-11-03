import { z } from "zod";
import { STORY_GENRES } from "@tsh/backend/constants/Genres";
import { CONTENT_WARNINGS } from "@tsh/backend/constants/ContentWarnings";
import { AgeRating } from "./gqlTypes";

// Source of truth for age ratings is the GraphQL AgeRating enum
const AGE_RATING_VALUES = Object.values(AgeRating) as [string, ...string[]];

export const CreateStoryFormSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title must be less than 200 characters"),
  synopsis: z
    .string()
    .min(50, "Synopsis must be at least 50 characters")
    .max(2000, "Synopsis must be less than 2000 characters"),
  genre: z
    .array(z.enum(STORY_GENRES as unknown as [string, ...string[]]))
    .min(1, "Select at least one genre"),
  ageRating: z.enum(AGE_RATING_VALUES),
  contentWarnings: z.array(
    z.enum(CONTENT_WARNINGS as unknown as [string, ...string[]]),
  ),
  ratingExplanation: z.string().max(500).optional(),
  coverImageUrl: z.string().url().optional().or(z.literal("")),
  aiCreated: z.boolean().optional(),
  allowAI: z.boolean().optional(),
  chapterContent: z
    .string()
    .min(500, "First chapter must be at least 500 characters"),
});

export type CreateStoryFormData = z.infer<typeof CreateStoryFormSchema>;

export const UpdateStoryFormSchema = z.object({
  storyId: z.string(),
  title: z.string().min(3).max(200).optional(),
  synopsis: z.string().min(50).max(2000).optional(),
  genre: z
    .array(z.enum(STORY_GENRES as unknown as [string, ...string[]]))
    .optional(),
  ageRating: z.enum(AGE_RATING_VALUES).optional(),
  contentWarnings: z
    .array(z.enum(CONTENT_WARNINGS as unknown as [string, ...string[]]))
    .optional(),
  featured: z.boolean().optional(),
  coverImageUrl: z.string().url().optional().or(z.literal("")),
  allowAI: z.boolean().optional(),
});

export type UpdateStoryFormData = z.infer<typeof UpdateStoryFormSchema>;

// Response Schemas for API validation
export const StoryStatsSchema = z.object({
  __typename: z.literal("StoryStats").optional(),
  totalBranches: z.number().int().min(0).default(0),
  totalReads: z.number().int().min(0).default(0),
  totalComments: z.number().int().min(0).default(0),
  rating: z.number().min(0).max(5).nullable().optional(),
});

export type StoryStats = z.infer<typeof StoryStatsSchema>;

export const StorySchema = z.object({
  __typename: z.literal("Story").optional(),
  storyId: z.string().uuid(),
  authorId: z.string(),
  authorName: z.string(),
  authorPatreonSupporter: z.boolean().nullable().optional().default(false),
  authorOGSupporter: z.boolean().nullable().optional().default(false),
  title: z.string(),
  synopsis: z.string(),
  genre: z.array(z.string()),
  ageRating: z.enum(AGE_RATING_VALUES), // Validate against GraphQL AgeRating enum
  contentWarnings: z.array(z.string()),
  ratingExplanation: z.string().nullable().optional(),
  stats: StoryStatsSchema,
  featured: z.boolean().default(false),
  createdAt: z.string(), // Accept any datetime string
  coverImageUrl: z.string().nullable().optional(),
  rootNodeId: z.string().nullable().optional(), // Make UUID check optional
  aiCreated: z.boolean().default(false),
  allowAI: z.boolean().default(false),
});

export type Story = z.infer<typeof StorySchema>;

export const StoryConnectionSchema = z.object({
  __typename: z.literal("StoryConnection").optional(),
  items: z.array(StorySchema),
  nextToken: z.string().nullable().optional(),
});

export type StoryConnection = z.infer<typeof StoryConnectionSchema>;
