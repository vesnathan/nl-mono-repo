export const AGE_RATINGS = [
  { id: 'G', displayName: 'General', description: 'Suitable for all ages' },
  { id: 'T', displayName: 'Teen (13+)', description: 'Ages 13+' },
  { id: 'M', displayName: 'Mature (16+)', description: 'Ages 16+' },
  { id: 'ADULT_18_PLUS', displayName: 'Adult (18+)', description: 'Ages 18+' },
] as const;

export type AgeRating = typeof AGE_RATINGS[number]['id'];
export const isValidAgeRating = (value: string): value is AgeRating =>
  AGE_RATINGS.some(r => r.id === value);
