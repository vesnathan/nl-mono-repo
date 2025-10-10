// Shared helpers and types for events
export const PLACEHOLDER_IMAGE = "/images/event-placeholder.svg";

export function imageSrc(image?: string): string {
  if (!image) return PLACEHOLDER_IMAGE;
  const s = String(image);
  // Allow local paths, data URIs, and remote http(s) URLs.
  if (
    s.startsWith("/") ||
    s.startsWith("data:") ||
    s.startsWith("http://") ||
    s.startsWith("https://")
  )
    return s;
  return PLACEHOLDER_IMAGE;
}

// A small set of stable remote images to try when the event's image 404s.
export const FALLBACK_REMOTE_IMAGES: string[] = [
  "https://picsum.photos/seed/picsum1/800/500",
  "https://picsum.photos/seed/picsum2/800/500",
  "https://picsum.photos/seed/picsum3/800/500",
  "https://picsum.photos/seed/picsum4/800/500",
  "https://picsum.photos/seed/picsum5/800/500",
  "https://picsum.photos/seed/picsum6/800/500",
];

export function isRemoteSrc(s?: string) {
  if (!s) return false;
  return s.startsWith("http://") || s.startsWith("https://");
}

export function formatRange(start?: string, end?: string) {
  if (!start) return "";
  const s = new Date(start);
  const e = end ? new Date(end) : null;
  if (!e) return s.toLocaleString();
  const msInDay = 24 * 60 * 60 * 1000;
  const dayDiff = Math.round(
    (e.setHours(0, 0, 0, 0) - s.setHours(0, 0, 0, 0)) / msInDay,
  );
  if (dayDiff === 0)
    return `${s.toLocaleDateString()} ${s.toLocaleTimeString()} - ${new Date(end!).toLocaleTimeString()}`;
  return `${s.toLocaleDateString()} — ${e.toLocaleDateString()}`;
}

export type MockEvent = {
  id: string;
  title?: string;
  image?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  accessType?: string;
  requiresRegistration?: boolean;
  price?: string | number;
  eventOwner?: { ownerCompany?: string };
  shortDescription?: string;
  description?: string;
  sessions?: Array<{
    start?: string | number | null;
    end?: string | number | null;
  }>;
  ticketInfo?: { price?: number } | null;
};

export type SessionStub = {
  start?: string | number | null;
  end?: string | number | null;
};
