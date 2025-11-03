"use client";

import { Button } from "@nextui-org/react";
import Link from "next/link";
import { StoriesGrid } from "@/components/stories/StoriesGrid";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { useGenreStories } from "@/hooks/useStories";
import ParallaxSection from "@/components/layout/ParallaxSection";
import ParallaxGap from "@/components/layout/ParallaxGap";

interface GenreSectionProps {
  genre: string;
  background?: string;
  image?: string;
  limit?: number;
}

export function GenreSection({
  genre,
  background = "#1a1a1a",
  image,
  limit = 8,
}: GenreSectionProps) {
  const { data, isLoading, error, refetch } = useGenreStories(genre, limit);

  const content = (
    <div className="container mx-auto px-4 py-20 relative z-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <h2
            className={`text-4xl md:text-5xl font-bold text-white ${image ? "drop-shadow-lg" : ""}`}
          >
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
  );

  // If image is provided, use ParallaxGap with background image
  if (image) {
    return (
      <ParallaxGap
        image={image}
        minHeight="auto"
        overlay="linear-gradient(0deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.65) 100%)"
      >
        <div className="w-full pt-32 pb-32 px-4">{content}</div>
      </ParallaxGap>
    );
  }

  // Otherwise use ParallaxSection with solid background
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
      {content}
    </ParallaxSection>
  );
}
