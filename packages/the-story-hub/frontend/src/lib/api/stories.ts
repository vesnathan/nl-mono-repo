/* eslint-disable no-underscore-dangle */
import { z } from "zod";
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
  TreeDataSchema,
  ChapterNodeSchema,
  type Story,
  type StoryConnection,
  type TreeData,
  type ChapterNode,
} from "@/types/ValidationSchemas";
import type {
  CreateStoryInput,
  UpdateStoryInput,
  StoryFilter,
} from "@/types/gqlTypes";
import {
  shouldUseLocalData,
  getStoryById,
  getAllStories,
} from "@/lib/local-data";

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
  // Use local data if enabled
  if (shouldUseLocalData()) {
    const localStory = getStoryById(storyId);
    return localStory as Story | null;
  }

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
  // Use local data if enabled
  if (shouldUseLocalData()) {
    let stories = getAllStories();

    // Apply genre filter if provided
    if (filter?.genre) {
      stories = stories.filter((story) =>
        (story.genre as unknown as string[])?.includes(filter.genre!),
      );
    }

    // Apply limit if provided
    if (limit) {
      stories = stories.slice(0, limit);
    }

    // Cast to mutable Story[] type
    return {
      items: stories.map((s) => ({
        ...s,
        genre: [...(s.genre as unknown as readonly string[])],
      })) as unknown as Story[],
      nextToken: null,
      __typename: "StoryConnection" as const,
    };
  }

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
  if (!result.data.getStoryTree) return null;
  return TreeDataSchema.parse(result.data.getStoryTree);
}

export async function getReadingPathAPI(
  storyId: string,
  nodePath: string[],
): Promise<ChapterNode[]> {
  const result = await client.graphql({
    query: getReadingPath,
    variables: { storyId, nodePath },
  });
  return z
    .array(ChapterNodeSchema)
    .parse(
      (result as { data: { getReadingPath: unknown } }).data.getReadingPath,
    );
}
