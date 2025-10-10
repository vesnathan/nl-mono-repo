import React from "react";
import EventPage from "@/components/routes/events/EventPage";

// Inline typed parameters for Next page default export to avoid type alias collisions
export default function Page(props: any) {
  const eventId = props?.params?.eventId ?? "";
  return <EventPage eventId={String(eventId)} />;
}

// When using `output: 'export'`, Next requires generateStaticParams for dynamic routes.
export async function generateStaticParams() {
  // We don't pre-render any event pages for export by default.
  // Return an empty array to allow the build to complete. For full static
  // export, populate this with eventId params.
  return [];
}
