import React from "react";
import { EventPage } from "@/components/routes/events/EventPage";

// Use a narrow props shape matching Next's route params (avoid `any`)
type PageProps = {
  params?: { eventId?: string };
  // some calling contexts pass route.params
  route?: { params?: { eventId?: string } };
};

const Page = (props: PageProps) => {
  const params = props?.params ?? props?.route?.params;
  const eventId = params?.eventId ?? "";
  return <EventPage eventId={String(eventId)} />;
};

export default Page;
