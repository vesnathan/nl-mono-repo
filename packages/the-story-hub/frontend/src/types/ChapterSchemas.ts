import { z } from "zod";

export const CreateChapterFormSchema = z.object({
  storyId: z.string(),
  content: z.string().min(100, "Chapter must be at least 100 characters"),
  chapterNumber: z.number().int().positive(),
});

export type CreateChapterFormData = z.infer<typeof CreateChapterFormSchema>;

export const CreateBranchFormSchema = z.object({
  parentNodeId: z.string(),
  paragraphIndex: z.number().int().min(0).optional(),
  branchDescription: z
    .string()
    .min(10, "Branch description must be at least 10 characters")
    .max(200),
  content: z
    .string()
    .min(100, "Branch content must be at least 100 characters"),
  ratingFlag: z.boolean().optional(),
});

export type CreateBranchFormData = z.infer<typeof CreateBranchFormSchema>;

export const UpdateChapterFormSchema = z.object({
  storyId: z.string(),
  nodeId: z.string(),
  content: z.string().min(100).optional(),
  branchDescription: z.string().min(10).max(200).optional(),
});

export type UpdateChapterFormData = z.infer<typeof UpdateChapterFormSchema>;
