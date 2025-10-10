import React from "react";
import Link from "next/link";
import MockEventsRaw from "@cwl/dev-mocks/mockEvents.json";
import EventCard from "./EventCard";

type MockEvent = {
  id: string;
  title?: string;
  image?: string;
  shortDescription?: string;
  accessType?: string;
  location?: string;
  requiresRegistration?: boolean;
  startDate?: string;
  endDate?: string;
};

const EVENTS: MockEvent[] = MockEventsRaw as unknown as MockEvent[];

function isLive(e: MockEvent) {
  try {
    if (!e.startDate || !e.endDate) return false;
    const s = Date.parse(String(e.startDate));
    const en = Date.parse(String(e.endDate));
    const now = Date.now();
    return s <= now && now <= en;
  } catch {
    return false;
  }
}

export const Events = () => {
  const free = EVENTS.filter((e) =>
    ["free", "free-register"].includes(e.accessType || ""),
  );
  const paid = EVENTS.filter(
    (e) => e.accessType === "paid" || e.accessType === "invite-paid",
  );
  const live = EVENTS.filter(isLive);

  return (
    <main className="max-w-7xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold mb-6">All Public Events</h1>

      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">Live Now</h2>
          <Link href="/discover/events/live" className="underline text-sm">
            View live listing
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {live.map((event) => (
            <EventCard key={event.id} event={event} variant="live" />
          ))}
        </div>
      </section>

      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">Free Events</h2>
          <Link href="/discover/events/free" className="underline text-sm">
            View free listing
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {free.map((event) => (
            <EventCard key={event.id} event={event} variant="free" />
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">Paid Events</h2>
          <Link href="/discover/events/paid" className="underline text-sm">
            View paid listing
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {paid.map((event) => (
            <EventCard key={event.id} event={event} variant="paid" />
          ))}
        </div>
      </section>
    </main>
  );
};
