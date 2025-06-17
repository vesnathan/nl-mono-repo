export const SALUTATIONS = [
  { id: 'Mr', value: 'Mr' },
  { id: 'Mrs', value: 'Mrs' },
  { id: 'Ms', value: 'Ms' },
  { id: 'Miss', value: 'Miss' },
  { id: 'Dr', value: 'Dr' },
  { id: 'Prof', value: 'Prof' },
  { id: 'Rev', value: 'Rev' },
  { id: 'Other', value: 'Other' },
] as const;

export type SalutationValue = typeof SALUTATIONS[number]['value'];
