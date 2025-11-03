"use client";

import { Button } from "@nextui-org/react";
import Link from "next/link";
import { StoriesGrid } from "@/components/stories/StoriesGrid";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { useGenreStories } from "@/hooks/useStories";
import ParallaxSection from "@/components/layout/ParallaxSection";

interface GenreSectionProps {
  genre: string;
  background?: string;
  limit?: number;
}

export function GenreSection({
  genre,
  background = "#1a1a1a",
  limit = 8,
}: GenreSectionProps) {
  const { data, isLoading, error, refetch } = useGenreStories(genre, limit);

  return (
    <ParallaxSection
      background={background}
      minHeight="auto"
      className="relative overflow-hidden"
    >
      {/* Subtle diagonal lines pattern */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 35px,
            rgba(255,255,255,0.1) 35px,
            rgba(255,255,255,0.1) 70px
          )`,
        }}
      />
      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white">
              {genre} Stories
            </h2>
            <Link href={`/browse?genre=${encodeURIComponent(genre)}`}>
              <Button
                variant="bordered"
                className="text-white border-white hover:bg-white/20"
              >
                View All
              </Button>
            </Link>
          </div>
          {error ? (
            <ErrorMessage
              message={`Failed to load ${genre.toLowerCase()} stories`}
              retry={refetch}
            />
          ) : isLoading ? (
            <LoadingSpinner label={`Loading ${genre.toLowerCase()} stories...`} />
          ) : (
            <StoriesGrid stories={data?.items || []} />
          )}
        </div>
      </div>
    </ParallaxSection>
  );
}
