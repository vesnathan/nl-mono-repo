// Server component wrapper for static export
// Provides generateStaticParams for Next.js static export

import StoryPageClient from "./StoryPageClient";

// Force static generation (no SSR)
export const dynamic = "force-static";

// Required for static export with dynamic routes
// For client-side apps, we generate a single fallback page
// All dynamic routing happens client-side via React Router
export async function generateStaticParams() {
  // Return a single dummy param to generate the base page
  // The actual story rendering happens client-side
  return [{ storyId: "placeholder", nodeId: [] }];
}

export default function StoryDetailPage() {
  return <StoryPageClient />;
}
