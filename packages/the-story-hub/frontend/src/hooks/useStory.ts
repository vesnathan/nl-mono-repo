import { useQuery } from '@tanstack/react-query';
import { getStoryAPI, getStoryTreeAPI } from '@/lib/api/stories';

export function useStory(storyId: string) {
  return useQuery({
    queryKey: ['story', storyId],
    queryFn: () => getStoryAPI(storyId),
    enabled: !!storyId,
  });
}

export function useStoryTree(storyId: string) {
  return useQuery({
    queryKey: ['storyTree', storyId],
    queryFn: () => getStoryTreeAPI(storyId),
    enabled: !!storyId,
  });
}
