"use client";

import React, { useEffect, useState } from "react";
import { EventBase } from "@/types/EventTypes";

type Props = {
  eventId: string;
};

// Temporary mock fetch - replace with real GraphQL/AJAX call
const fetchEvent = async (eventId: string): Promise<EventBase | null> => {
  // In future: use amplify GraphQL or REST client
  return {
    id: eventId,
    title: `Demo Event ${eventId}`,
    description: "This is a demo event used for local development.",
    mode: eventId.includes("paid") ? "paid" : eventId.includes("register") ? "register" : "free",
    sessions: [
      {
        id: "s1",
        title: "Keynote: The Future of Events",
        type: "keynote",
        start: new Date().toISOString(),
        end: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        speakers: [{ id: "sp1", name: "Jane Speaker" }],
      },
    ],
  };
};

export const EventPage: React.FC<Props> = ({ eventId }) => {
  const [event, setEvent] = useState<EventBase | null>(null);

  useEffect(() => {
    fetchEvent(eventId).then(setEvent);
  }, [eventId]);

  if (!event) return <div>Loading event...</div>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-2">{event.title}</h1>
      <p className="mb-4">{event.shortDescription || event.description}</p>

      {event.mode === "free" && (
        <div className="mb-4">
          <strong>Free event</strong>
          <p>Join for free — no registration required.</p>
        </div>
      )}

      {event.mode === "register" && (
        <div className="mb-4">
          <strong>Registration required</strong>
          <p>
            Please register to attend. <a href={event.registrationUrl}>Register</a>
          </p>
        </div>
      )}

      {event.mode === "paid" && (
        <div className="mb-4">
          <strong>Paid event</strong>
          <p>
            Tickets available — price: {event.ticketInfo?.currency} {event.ticketInfo?.price}
          </p>
          {event.ticketInfo?.buyUrl && (
            <a href={event.ticketInfo.buyUrl} className="text-blue-600 underline">
              Buy ticket
            </a>
          )}
        </div>
      )}

      {event.streamUrl && (
        <div className="mb-4">
          <strong>Live Stream</strong>
          <div>
            <a href={event.streamUrl} className="text-blue-600 underline">
              Watch stream
            </a>
          </div>
        </div>
      )}

      {/* Agenda */}
      {event.sessions && event.sessions.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-2">Agenda</h2>
          <ul className="space-y-3">
            {event.sessions.map((s) => (
              <li key={s.id} className="p-3 border rounded">
                <div className="font-semibold">{s.title}</div>
                <div className="text-sm text-gray-600">{s.type}</div>
                <div>{s.description}</div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};

export default EventPage;
