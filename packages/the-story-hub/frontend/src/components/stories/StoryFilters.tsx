"use client";

import { Input, Select, SelectItem, Chip } from "@nextui-org/react";
import { STORY_GENRES } from "@tsh/backend/constants/Genres";
import { AGE_RATINGS } from "@tsh/backend/constants/ContentRatings";

interface StoryFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedGenres: string[];
  onGenresChange: (genres: string[]) => void;
  selectedAgeRatings: string[];
  onAgeRatingsChange: (ratings: string[]) => void;
}

export function StoryFilters({
  searchTerm,
  onSearchChange,
  selectedGenres,
  onGenresChange,
  selectedAgeRatings,
  onAgeRatingsChange,
}: StoryFiltersProps) {
  const handleGenreToggle = (genre: string) => {
    if (selectedGenres.includes(genre)) {
      onGenresChange(selectedGenres.filter((g) => g !== genre));
    } else {
      onGenresChange([...selectedGenres, genre]);
    }
  };

  const handleRatingToggle = (rating: string) => {
    if (selectedAgeRatings.includes(rating)) {
      onAgeRatingsChange(selectedAgeRatings.filter((r) => r !== rating));
    } else {
      onAgeRatingsChange([...selectedAgeRatings, rating]);
    }
  };

  return (
    <div className="space-y-6">
      <Input
        placeholder="Search stories..."
        value={searchTerm}
        onValueChange={onSearchChange}
        startContent={<span className="text-gray-400">🔍</span>}
        variant="bordered"
        size="lg"
        classNames={{
          input: "text-base bg-gray-800 text-white",
          inputWrapper: "h-12 bg-gray-800 border-gray-600 hover:border-gray-500",
        }}
      />

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Genres</h3>
        <div className="flex flex-wrap gap-2">
          {STORY_GENRES.map((genre) => (
            <Chip
              key={genre}
              variant={selectedGenres.includes(genre) ? "solid" : "bordered"}
              color={selectedGenres.includes(genre) ? "primary" : "default"}
              onClick={() => handleGenreToggle(genre)}
              className={`cursor-pointer hover:scale-105 transition-transform w-[140px] justify-center ${
                selectedGenres.includes(genre)
                  ? "bg-brand-purple text-white"
                  : "bg-gray-800 border-gray-600 text-gray-300 hover:border-gray-500"
              }`}
            >
              {genre}
            </Chip>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Age Rating</h3>
        <div className="flex flex-wrap gap-2">
          {AGE_RATINGS.map((rating) => (
            <Chip
              key={rating.id}
              variant={
                selectedAgeRatings.includes(rating.id) ? "solid" : "bordered"
              }
              color={
                selectedAgeRatings.includes(rating.id) ? "warning" : "default"
              }
              onClick={() => handleRatingToggle(rating.id)}
              className={`cursor-pointer hover:scale-105 transition-transform w-[140px] justify-center ${
                selectedAgeRatings.includes(rating.id)
                  ? "bg-[#F28C28] text-white"
                  : "bg-gray-800 border-gray-600 text-gray-300 hover:border-gray-500"
              }`}
            >
              {rating.displayName}
            </Chip>
          ))}
        </div>
      </div>

      {(selectedGenres.length > 0 ||
        selectedAgeRatings.length > 0 ||
        searchTerm) && (
        <button
          onClick={() => {
            onSearchChange("");
            onGenresChange([]);
            onAgeRatingsChange([]);
          }}
          className="text-sm text-brand-purple hover:text-purple-400 hover:underline transition-colors"
        >
          Clear all filters
        </button>
      )}
    </div>
  );
}
