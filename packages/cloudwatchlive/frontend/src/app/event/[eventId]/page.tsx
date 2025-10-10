import React from "react";
import EventPage from "@/components/routes/events/EventPage";

// Typed parameters for Next page default export
export default function Page(props: unknown) {
  // Narrow unknown to the expected shape without using `any`.
  const maybeParams = (props as { params?: { eventId?: string } } | undefined)
    ?.params;

  const eventId = maybeParams?.eventId ?? "";

  return <EventPage eventId={String(eventId)} />;
}

// When using `output: 'export'`, Next requires generateStaticParams for dynamic routes.
export async function generateStaticParams() {
  // We don't pre-render any event pages for export by default.
  // Return an empty array to allow the build to complete. For full static
  // export, populate this with eventId params.
  return [];
}
