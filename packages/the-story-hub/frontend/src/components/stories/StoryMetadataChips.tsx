"use client";

import { Chip, Tooltip } from "@nextui-org/react";

// Helper function to get age rating description
const getAgeRatingTooltip = (ageRating: string) => {
  const ratings: { [key: string]: string } = {
    'G': 'General - Suitable for all ages',
    'PG': 'Parental Guidance - Some material may not be suitable for children',
    'PG_13': 'PG-13 - Parents strongly cautioned. Some material may be inappropriate for children under 13',
    'M': 'Mature (16+) - Content suitable for ages 16 and above',
    'ADULT_18_PLUS': 'Adult (18+) - Content suitable for ages 18 and above only'
  };
  return ratings[ageRating] || 'Age rating information';
};

interface StoryMetadataChipsProps {
  aiCreated?: boolean;
  featured?: boolean;
  genres: string[];
  ageRating: string;
  maxGenres?: number;
  showAIBadge?: boolean;
  showFeatured?: boolean;
}

export function StoryMetadataChips({
  aiCreated = false,
  featured = false,
  genres,
  ageRating,
  maxGenres,
  showAIBadge = true,
  showFeatured = true,
}: StoryMetadataChipsProps) {
  const displayGenres = maxGenres ? genres.slice(0, maxGenres) : genres;

  return (
    <>
      {aiCreated && showAIBadge && (
        <Tooltip content="This story was created with AI assistance">
          <Chip size="sm" variant="solid" className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold px-3">
            🤖 AI Generated
          </Chip>
        </Tooltip>
      )}
      {featured && showFeatured && (
        <Tooltip content="Featured story selected by our team">
          <Chip size="sm" variant="flat" className="bg-yellow-600 text-white px-3">
            ⭐ Featured
          </Chip>
        </Tooltip>
      )}
      {displayGenres.map((genre) => (
        <Tooltip key={genre} content={`Genre: ${genre}`}>
          <Chip size="sm" variant="flat" className="bg-[#00457C] text-white px-3">
            {genre}
          </Chip>
        </Tooltip>
      ))}
      <Tooltip content={getAgeRatingTooltip(ageRating)}>
        <Chip size="sm" variant="flat" className="bg-[#F28C28] text-white px-3">
          {ageRating === 'ADULT_18_PLUS' ? '18+' : ageRating.replace(/_/g, "-")}
        </Chip>
      </Tooltip>
    </>
  );
}
