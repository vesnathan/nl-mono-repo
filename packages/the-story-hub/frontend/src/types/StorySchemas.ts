import { z } from "zod";
import { AgeRating } from "./gqlTypes";
import { AGE_RATINGS } from "@tsh/backend/constants/ContentRatings";
import { STORY_GENRES } from "@tsh/backend/constants/Genres";
import { CONTENT_WARNINGS } from "@tsh/backend/constants/ContentWarnings";

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
  ageRating: z.nativeEnum(AgeRating),
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
  ageRating: z.nativeEnum(AgeRating).optional(),
  contentWarnings: z
    .array(z.enum(CONTENT_WARNINGS as unknown as [string, ...string[]]))
    .optional(),
  featured: z.boolean().optional(),
  coverImageUrl: z.string().url().optional().or(z.literal("")),
  allowAI: z.boolean().optional(),
});

export type UpdateStoryFormData = z.infer<typeof UpdateStoryFormSchema>;
