// Age rating values - must match GraphQL AgeRating enum in Story.graphql
// Source of truth: packages/the-story-hub/backend/schema/Story.graphql
export const AGE_RATINGS = [
  { id: "G", displayName: "General", description: "Suitable for all ages" },
  { id: "PG", displayName: "Parental Guidance", description: "Parental guidance suggested" },
  { id: "PG_13", displayName: "PG-13", description: "Parents strongly cautioned - Ages 13+" },
  { id: "M", displayName: "Mature (16+)", description: "Ages 16+" },
  { id: "ADULT_18_PLUS", displayName: "Adult (18+)", description: "Ages 18+" },
] as const;

export type AgeRating = (typeof AGE_RATINGS)[number]["id"];

export const isValidAgeRating = (value: string): value is AgeRating =>
  AGE_RATINGS.some((r) => r.id === value);
