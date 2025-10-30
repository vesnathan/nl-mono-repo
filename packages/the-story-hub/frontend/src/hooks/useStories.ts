import { useQuery } from '@tanstack/react-query';
import { listStoriesAPI } from '@/lib/api/stories';
import type { StoryFilter } from '@/types/gqlTypes';

export function useStories(filter?: StoryFilter, limit: number = 20) {
  return useQuery({
    queryKey: ['stories', filter, limit],
    queryFn: () => listStoriesAPI(filter, limit),
  });
}

export function useFeaturedStories(limit: number = 8) {
  return useQuery({
    queryKey: ['stories', 'featured', limit],
    queryFn: () => listStoriesAPI({ featured: true }, limit),
  });
}

export function useTrendingStories(limit: number = 8) {
  return useQuery({
    queryKey: ['stories', 'trending', limit],
    queryFn: () => listStoriesAPI(undefined, limit),
    select: (data) => {
      // Sort by reads and rating to get trending stories
      return {
        ...data,
        items: [...data.items].sort((a, b) => {
          const scoreA = (a.stats.totalReads || 0) + (a.stats.rating || 0) * 100;
          const scoreB = (b.stats.totalReads || 0) + (b.stats.rating || 0) * 100;
          return scoreB - scoreA;
        }),
      };
    },
  });
}
