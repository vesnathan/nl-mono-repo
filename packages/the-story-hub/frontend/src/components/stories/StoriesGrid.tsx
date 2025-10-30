'use client';

import { StoryCard } from './StoryCard';
import type { Story } from '@/types/gqlTypes';

interface StoriesGridProps {
  stories: Story[];
  loading?: boolean;
  emptyMessage?: string;
}

export function StoriesGrid({
  stories,
  loading = false,
  emptyMessage = 'No stories found'
}: StoriesGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-[400px] bg-default-100 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (stories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-6xl mb-4">📚</div>
        <p className="text-xl text-default-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {stories.map((story, index) => (
        <StoryCard key={story.storyId} story={story} index={index} />
      ))}
    </div>
  );
}
