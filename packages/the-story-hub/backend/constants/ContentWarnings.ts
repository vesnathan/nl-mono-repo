export const CONTENT_WARNINGS = [
  'Sexual Content',
  'Violence/Gore',
  'Death',
  'Self-Harm/Suicide',
  'Substance Abuse',
  'Profanity',
  'Graphic Imagery',
  'Sensitive Topics',
] as const;

export type ContentWarning = typeof CONTENT_WARNINGS[number];
export const isValidContentWarning = (value: string): value is ContentWarning =>
  CONTENT_WARNINGS.includes(value as ContentWarning);
