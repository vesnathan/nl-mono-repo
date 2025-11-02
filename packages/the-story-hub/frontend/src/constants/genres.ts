// Story genres - matches backend constants
export const STORY_GENRES = [
  "Fantasy",
  "Sci-Fi",
  "Romance",
  "Horror",
  "Mystery",
  "Thriller",
  "Adventure",
  "Drama",
  "Comedy",
  "Historical Fiction",
  "Contemporary",
  "Paranormal",
  "Urban Fantasy",
  "Dystopian",
  "Young Adult",
  "Fan Fiction",
] as const;

export type StoryGenre = (typeof STORY_GENRES)[number];

// Randomly select N genres for homepage display
export function getRandomGenres(count: number = 6): StoryGenre[] {
  const shuffled = [...STORY_GENRES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count) as StoryGenre[];
}

// Get a fixed set of genres for consistent homepage display
// Uses a seeded random so it's consistent per session
export function getHomePageGenres(): StoryGenre[] {
  // For now, return a curated selection
  // Could be made dynamic/randomized per session
  return ["Fantasy", "Sci-Fi", "Mystery", "Horror", "Romance", "Thriller"];
}
