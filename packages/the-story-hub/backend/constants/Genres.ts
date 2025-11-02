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
export const isValidGenre = (value: string): value is StoryGenre =>
  STORY_GENRES.includes(value as StoryGenre);
