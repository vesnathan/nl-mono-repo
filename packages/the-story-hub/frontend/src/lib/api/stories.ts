import { client } from '@/lib/amplify';
import { createStory, updateStory } from '@/graphql/mutations';
import { getStory, listStories, getStoryTree, getReadingPath } from '@/graphql/queries';
import type {
  Story,
  CreateStoryInput,
  UpdateStoryInput,
  StoryFilter,
  StoryConnection,
  TreeData,
  ChapterNode,
} from '@/types/gqlTypes';

export async function createStoryAPI(input: CreateStoryInput): Promise<Story> {
  const result = await client.graphql({
    query: createStory,
    variables: { input },
  });
  return result.data.createStory;
}

export async function updateStoryAPI(input: UpdateStoryInput): Promise<Story> {
  const result = await client.graphql({
    query: updateStory,
    variables: { input },
  });
  return result.data.updateStory;
}

export async function getStoryAPI(storyId: string): Promise<Story | null> {
  const result = await client.graphql({
    query: getStory,
    variables: { storyId },
  });
  return result.data.getStory ?? null;
}

export async function listStoriesAPI(
  filter?: StoryFilter,
  limit?: number,
  nextToken?: string
): Promise<StoryConnection> {
  const result = await client.graphql({
    query: listStories,
    variables: { filter, limit, nextToken },
  });
  return result.data.listStories;
}

export async function getStoryTreeAPI(storyId: string): Promise<TreeData | null> {
  const result = await client.graphql({
    query: getStoryTree,
    variables: { storyId },
  });
  return (result.data.getStoryTree as TreeData) ?? null;
}

export async function getReadingPathAPI(
  storyId: string,
  nodePath: string[]
): Promise<ChapterNode[]> {
  const result = await client.graphql({
    query: getReadingPath,
    variables: { storyId, nodePath },
  });
  return result.data.getReadingPath;
}
