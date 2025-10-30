'use client';

import { useState } from 'react';
import { Card, CardBody } from '@nextui-org/react';
import { StoriesGrid } from '@/components/stories/StoriesGrid';
import { StoryFilters } from '@/components/stories/StoryFilters';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { useStories } from '@/hooks/useStories';

export default function BrowsePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedAgeRatings, setSelectedAgeRatings] = useState<string[]>([]);

  const { data, isLoading, error, refetch } = useStories({
    genre: selectedGenres.length > 0 ? selectedGenres[0] : undefined,
    ageRating: selectedAgeRatings.length > 0 ? (selectedAgeRatings[0] as any) : undefined,
  });

  // Client-side search filtering
  const filteredStories = data?.items.filter((story) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      story.title.toLowerCase().includes(searchLower) ||
      story.synopsis.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="min-h-screen bg-default-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8 text-default-900">Browse Stories</h1>

        <div className="grid lg:grid-cols-[300px_1fr] gap-8">
          {/* Filters Sidebar */}
          <aside>
            <Card>
              <CardBody className="p-6">
                <h2 className="text-lg font-semibold mb-4">Filters</h2>
                <StoryFilters
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  selectedGenres={selectedGenres}
                  onGenresChange={setSelectedGenres}
                  selectedAgeRatings={selectedAgeRatings}
                  onAgeRatingsChange={setSelectedAgeRatings}
                />
              </CardBody>
            </Card>
          </aside>

          {/* Stories Grid */}
          <main>
            {error ? (
              <ErrorMessage message="Failed to load stories" retry={refetch} />
            ) : isLoading ? (
              <LoadingSpinner label="Loading stories..." />
            ) : (
              <>
                <div className="mb-4 text-default-600">
                  Found {filteredStories?.length || 0} stories
                </div>
                <StoriesGrid
                  stories={filteredStories || []}
                  emptyMessage="No stories match your filters. Try adjusting your search criteria."
                />
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
