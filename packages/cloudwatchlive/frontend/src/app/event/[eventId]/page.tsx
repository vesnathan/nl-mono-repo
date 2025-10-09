import React from "react";
import EventPage from "@/components/routes/events/EventPage";

type Params = {
  params: { eventId: string };
};

const Page = ({ params }: Params) => {
  const { eventId } = params;
  return <EventPage eventId={eventId} />;
};

export default Page;
