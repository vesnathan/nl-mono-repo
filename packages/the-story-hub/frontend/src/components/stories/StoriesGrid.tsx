"use client";

import type { Story } from "@/types/gqlTypes";
import { StoryCard } from "./StoryCard";

interface StoriesGridProps {
  stories: Story[];
  loading?: boolean;
  emptyMessage?: string;
}

export function StoriesGrid({
  stories,
  loading = false,
  emptyMessage = "No stories found",
}: StoriesGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 8 }, (_, i) => `skeleton-${i}`).map((key) => (
          <div
            key={key}
            className="h-[200px] bg-gray-800 border border-gray-700 animate-pulse"
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
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {stories.map((story) => (
        <StoryCard key={story.storyId} story={story} />
      ))}
    </div>
  );
}
