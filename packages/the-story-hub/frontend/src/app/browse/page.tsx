"use client";

import { useState } from "react";
import { StoriesGrid } from "@/components/stories/StoriesGrid";
import { StoryFilters } from "@/components/stories/StoryFilters";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { useStories } from "@/hooks/useStories";
import ParallaxGap from "@/components/layout/ParallaxGap";
import ParallaxSection from "@/components/layout/ParallaxSection";

const CONSTELLATION_IMAGE_URL = "/images/constellation1.webp";

export default function BrowsePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedAgeRatings, setSelectedAgeRatings] = useState<string[]>([]);

  const { data, isLoading, error, refetch } = useStories({
    genre: selectedGenres.length > 0 ? selectedGenres[0] : undefined,
    ageRating:
      selectedAgeRatings.length > 0
        ? (selectedAgeRatings[0] as any)
        : undefined,
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
    <div className="min-h-screen">
      {/* Hero Section with Background Image */}
      <div className="relative z-20">
        <div className="relative overflow-hidden">
          <ParallaxGap
            image="/themes/adventure.jpg"
            minHeight="auto"
            overlay="linear-gradient(0deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.65) 100%)"
          >
            <div className="w-full pt-24 pb-32 px-4">
              <div className="max-w-4xl mx-auto text-center">
                <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">
                  Browse Stories
                </h1>
                <p className="text-xl text-white drop-shadow-lg leading-relaxed">
                  Explore our collection of collaborative stories across all genres
                </p>
              </div>
            </div>
          </ParallaxGap>
          {/* Wave curve at bottom */}
          <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-[0]">
            <svg
              className="relative block w-full h-[60px]"
              viewBox="0 0 1200 120"
              preserveAspectRatio="none"
            >
              <path
                d="M0,0 C300,100 900,100 1200,0 L1200,120 L0,120 Z"
                fill="#1a1a1a"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Main Content Section - Dark Background with Constellation */}
      <ParallaxSection
        background="#1a1a1a"
        minHeight="auto"
        className="relative overflow-hidden -mt-32 pt-16 z-10"
      >
        {/* Subtle constellation background */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `url(${CONSTELLATION_IMAGE_URL})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        />
        <div className="container mx-auto px-4 py-12 relative z-10">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-[320px_1fr] gap-8">
              {/* Filters Sidebar */}
              <aside>
                <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 sticky top-24">
                  <h2 className="text-2xl font-bold mb-6 text-white">Filters</h2>
                  <StoryFilters
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    selectedGenres={selectedGenres}
                    onGenresChange={setSelectedGenres}
                    selectedAgeRatings={selectedAgeRatings}
                    onAgeRatingsChange={setSelectedAgeRatings}
                  />
                </div>
              </aside>

              {/* Stories Grid */}
              <main>
                {error ? (
                  <ErrorMessage message="Failed to load stories" retry={refetch} />
                ) : isLoading ? (
                  <LoadingSpinner label="Loading stories..." />
                ) : (
                  <>
                    <div className="mb-6 text-gray-400 text-lg">
                      Found {filteredStories?.length || 0} {filteredStories?.length === 1 ? 'story' : 'stories'}
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
      </ParallaxSection>
    </div>
  );
}
