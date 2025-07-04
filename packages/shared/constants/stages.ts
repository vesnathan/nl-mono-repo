export const ALLOWED_STAGES = ['dev', 'staging', 'prod'] as const;
export type Stage = typeof ALLOWED_STAGES[number];
