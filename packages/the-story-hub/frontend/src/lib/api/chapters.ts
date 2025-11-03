import { z } from "zod";
import { client } from "@/lib/amplify";
import {
  createChapter,
  createBranch,
  updateChapter,
  voteOnChapter,
  awardBadge,
} from "@/graphql/mutations";
import { getChapter, listBranches } from "@/graphql/queries";
import type {
  CreateChapterInput,
  CreateBranchInput,
  UpdateChapterInput,
  AwardBadgeInput,
} from "@/types/gqlTypes";
import {
  ChapterNodeSchema,
  type ChapterNode,
  type VoteType,
} from "@/types/ValidationSchemas";
import {
  shouldUseLocalData,
  getNodeById,
  getBranchesForNode,
  setUsingLocalData,
} from "@/lib/local-data";

export async function createChapterAPI(
  input: CreateChapterInput,
): Promise<ChapterNode> {
  const result = await client.graphql({
    query: createChapter,
    variables: { input },
  });
  return ChapterNodeSchema.parse(result.data.createChapter);
}

export async function createBranchAPI(
  input: CreateBranchInput,
): Promise<ChapterNode> {
  const result = await client.graphql({
    query: createBranch,
    variables: { input },
  });
  return ChapterNodeSchema.parse(result.data.createBranch);
}

export async function updateChapterAPI(
  input: UpdateChapterInput,
): Promise<ChapterNode> {
  const result = await client.graphql({
    query: updateChapter,
    variables: { input },
  });
  return ChapterNodeSchema.parse(result.data.updateChapter);
}

export async function voteOnChapterAPI(
  storyId: string,
  nodeId: string,
  voteType: VoteType,
): Promise<ChapterNode> {
  const result = await client.graphql({
    query: voteOnChapter,
    variables: { storyId, nodeId, voteType },
  });
  return ChapterNodeSchema.parse(result.data.voteOnChapter);
}

export async function awardBadgeAPI(
  input: AwardBadgeInput,
): Promise<ChapterNode> {
  const result = await client.graphql({
    query: awardBadge,
    variables: { input },
  });
  return ChapterNodeSchema.parse(result.data.awardBadge);
}

export async function getChapterAPI(
  storyId: string,
  nodeId: string,
): Promise<ChapterNode | null> {
  // Use local data if enabled
  if (shouldUseLocalData()) {
    const node = getNodeById(nodeId);
    return node as ChapterNode | null;
  }

  try {
    const result = await client.graphql({
      query: getChapter,
      variables: { storyId, nodeId },
    });
    if (!result.data.getChapter) return null;
    return ChapterNodeSchema.parse(result.data.getChapter);
  } catch (error) {
    console.error("Error fetching chapter, falling back to local data:", error);
    setUsingLocalData();
    return getNodeById(nodeId) as ChapterNode | null;
  }
}

export async function listBranchesAPI(
  storyId: string,
  nodeId: string,
): Promise<ChapterNode[]> {
  // Use local data if enabled
  if (shouldUseLocalData()) {
    const branches = getBranchesForNode(storyId, nodeId);
    return branches as ChapterNode[];
  }

  try {
    const result = await client.graphql({
      query: listBranches,
      variables: { storyId, nodeId },
    });
    return z.array(ChapterNodeSchema).parse(result.data.listBranches);
  } catch (error) {
    console.error(
      "Error fetching branches, falling back to local data:",
      error,
    );
    setUsingLocalData();
    return getBranchesForNode(storyId, nodeId) as ChapterNode[];
  }
}
