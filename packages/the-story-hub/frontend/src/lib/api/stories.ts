/* eslint-disable no-underscore-dangle */
import { client } from "@/lib/amplify";
import { createStory, updateStory } from "@/graphql/mutations";
import {
  getStory,
  listStories,
  getStoryTree,
  getReadingPath,
} from "@/graphql/queries";
import {
  StorySchema,
  StoryConnectionSchema,
  type Story,
  type StoryConnection,
} from "@/types/StorySchemas";
import type {
  CreateStoryInput,
  UpdateStoryInput,
  StoryFilter,
  TreeData,
  ChapterNode,
} from "@/types/gqlTypes";

export async function createStoryAPI(input: CreateStoryInput): Promise<Story> {
  const result = await client.graphql({
    query: createStory,
    variables: { input },
  });

  // Validate response with Zod
  return StorySchema.parse(result.data.createStory);
}

export async function updateStoryAPI(input: UpdateStoryInput): Promise<Story> {
  const result = await client.graphql({
    query: updateStory,
    variables: { input },
  });

  // Validate response with Zod
  return StorySchema.parse(result.data.updateStory);
}

export async function getStoryAPI(storyId: string): Promise<Story | null> {
  const result = await client.graphql({
    query: getStory,
    variables: { storyId },
  });

  if (!result.data.getStory) {
    return null;
  }

  // Validate response with Zod
  return StorySchema.parse(result.data.getStory);
}

export async function listStoriesAPI(
  filter?: StoryFilter,
  limit?: number,
  nextToken?: string,
): Promise<StoryConnection> {
  const result = await client.graphql({
    query: listStories,
    variables: { filter, limit, nextToken },
  });

  // Validate response with Zod
  return StoryConnectionSchema.parse(result.data.listStories);
}

export async function getStoryTreeAPI(
  storyId: string,
): Promise<TreeData | null> {
  const result = await client.graphql({
    query: getStoryTree,
    variables: { storyId },
  });
  return (result.data.getStoryTree as TreeData) ?? null;
}

export async function getReadingPathAPI(
  storyId: string,
  nodePath: string[],
): Promise<ChapterNode[]> {
  const result = await client.graphql({
    query: getReadingPath,
    variables: { storyId, nodePath },
  });
  return result.data.getReadingPath;
}
