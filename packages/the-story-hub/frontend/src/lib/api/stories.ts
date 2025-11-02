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
import {
  shouldUseLocalData,
  getStoryById,
  getAllStories,
  setUsingLocalData,
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

  try {
    const result = await client.graphql({
      query: getStory,
      variables: { storyId },
    });

    if (!result.data.getStory) {
      return null;
    }

    // Validate response with Zod
    return StorySchema.parse(result.data.getStory);
  } catch (error) {
    console.error("Error fetching story, falling back to local data:", error);
    setUsingLocalData();
    return getStoryById(storyId) as Story | null;
  }
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
        story.genre?.includes(filter.genre!),
      );
    }

    // Apply limit if provided
    if (limit) {
      stories = stories.slice(0, limit);
    }

    return {
      items: stories as Story[],
      nextToken: null,
      total: stories.length,
    };
  }

  try {
    const result = await client.graphql({
      query: listStories,
      variables: { filter, limit, nextToken },
    });

    // Validate response with Zod
    return StoryConnectionSchema.parse(result.data.listStories);
  } catch (error) {
    console.error(
      "Error listing stories, falling back to local data:",
      error,
    );
    setUsingLocalData();
    let stories = getAllStories();

    // Apply genre filter if provided
    if (filter?.genre) {
      stories = stories.filter((story) =>
        story.genre?.includes(filter.genre!),
      );
    }

    // Apply limit if provided
    if (limit) {
      stories = stories.slice(0, limit);
    }

    return {
      items: stories as Story[],
      nextToken: null,
      total: stories.length,
    };
  }
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
