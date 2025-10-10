"use client";

import MockEventsRaw from "@cwl/dev-mocks/mockEvents.json"; // canonical dev-mocks
import Image from "next/image";
import Link from "next/link";
import Logo from "@/components/common/Logo";
import { Button } from "@nextui-org/react";
import EventCard from "@/components/routes/events/EventCard";
import { MockEvent as UtilsMockEvent } from "@/components/routes/events/eventsUtils";
// Use public image path to avoid Next's sharp native dependency during local build.
// Ensure the image is copied to packages/cloudwatchlive/frontend/public/images/login-bg.png
const LoginBackground = "/images/login-bg.png";

// Use canonical MockEvent type from eventsUtils to ensure session shape matches
type MockEvent = UtilsMockEvent;

const MockEventsData: MockEvent[] = MockEventsRaw as unknown as MockEvent[];

// Compute live events from startDate/endDate timestamps
const now = new Date();
const LIVE_EVENTS: MockEvent[] = MockEventsData.filter((e: MockEvent) => {
  try {
    if (!e.startDate || !e.endDate) return false;
    const s = new Date(e.startDate);
    const en = new Date(e.endDate);
    return s <= now && now <= en;
  } catch {
    return false;
  }
});

// Prepare counts and limited slices for the landing page (max 8 shown)
const MAX_SECTION = 8;

const ALL_FREE = MockEventsData.filter((e: MockEvent) =>
  ["free", "free-register"].includes(e.accessType ?? ""),
);
const FREE_EVENTS: MockEvent[] = ALL_FREE.slice(0, MAX_SECTION);

const ALL_PAID = MockEventsData.filter(
  (e: MockEvent) => e.accessType === "paid" || e.accessType === "invite-paid",
);
const PAID_EVENTS: MockEvent[] = ALL_PAID.slice(0, MAX_SECTION);

const LIMITED_LIVE_EVENTS = LIVE_EVENTS.slice(0, MAX_SECTION);
const TOTAL_LIVE = LIVE_EVENTS.length;
const TOTAL_FREE = ALL_FREE.length;
const TOTAL_PAID = ALL_PAID.length;

export default function LandingPage() {
  return (
    <div className="min-h-screen relative">
      {/* Background - matching login page exactly */}
      <div className="fixed w-screen h-screen">
        <div className="absolute w-full h-full bg-gradient-to-r from-secondary-500 to-primary-400 " />
        <Image src={LoginBackground} alt="Login Background" fill />
      </div>

      {/* Content wrapper with relative positioning */}
      <div className="relative z-10">
        {/* Header */}
        <header className="bg-white/95 backdrop-blur-sm shadow-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center">
              <Logo width={150} height={80} alt="CloudWatch Live" />
            </Link>

            <div className="flex items-center gap-4">
              <Button
                as={Link}
                href="/login"
                variant="light"
                className="font-semibold"
              >
                Log In
              </Button>
              <Button
                as={Link}
                href="/login"
                color="primary"
                className="font-semibold"
              >
                Sign Up
              </Button>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-6 py-16 text-center">
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-12 mb-12">
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-secondary-500 to-primary-400 bg-clip-text text-transparent">
              Stream Live Events from Anywhere
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Watch live-streamed events from top event management companies
              worldwide. Catch live events or watch archived recordings.
              Experience unforgettable moments anytime.
            </p>
            <Button
              as={Link}
              href="/login"
              size="lg"
              color="primary"
              className="font-semibold text-lg px-8 py-6"
            >
              Get Started
            </Button>
          </div>
          {TOTAL_LIVE > MAX_SECTION && (
            <div className="mt-4 text-right">
              <Link
                href="/discover/events/live"
                className="underline text-white"
              >
                View all Live events ({TOTAL_LIVE})
              </Link>
            </div>
          )}
        </section>

        {/* Live Now Section */}
        <section className="max-w-7xl mx-auto px-6 pb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <h2 className="text-3xl font-bold text-white drop-shadow-lg">
                Live Now
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {LIMITED_LIVE_EVENTS.map((event) => (
              <EventCard key={event.id} event={event} variant="live" />
            ))}
          </div>
          {TOTAL_LIVE > MAX_SECTION && (
            <div className="mt-4 text-right">
              <Link
                href="/discover/events/live"
                className="underline text-white"
              >
                View all Live events ({TOTAL_LIVE})
              </Link>
            </div>
          )}
        </section>

        {/* Free Events Section */}
        <section className="max-w-7xl mx-auto px-6 pb-16">
          <h2 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
            Upcoming Free Events
          </h2>
          <p className="text-white/90 mb-8 drop-shadow-lg">
            Browse upcoming free events. Some may require registration.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {FREE_EVENTS.map((event) => (
              <EventCard key={event.id} event={event} variant="free" />
            ))}
          </div>
          {TOTAL_FREE > MAX_SECTION && (
            <div className="mt-4 text-right">
              <Link
                href="/discover/events/free"
                className="underline text-white"
              >
                View all Free events ({TOTAL_FREE})
              </Link>
            </div>
          )}
        </section>

        {/* Paid Events Section */}
        <section className="max-w-7xl mx-auto px-6 pb-16">
          <h2 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
            Premium Paid Events
          </h2>
          <p className="text-white/90 mb-8 drop-shadow-lg">
            Exclusive paid events requiring registration. Get access to premium
            content and experiences.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {PAID_EVENTS.map((event) => (
              <EventCard key={event.id} event={event} variant="paid" />
            ))}
          </div>
          {TOTAL_PAID > MAX_SECTION && (
            <div className="mt-4 text-right">
              <Link
                href="/discover/events/paid"
                className="underline text-white"
              >
                View all Paid events ({TOTAL_PAID})
              </Link>
            </div>
          )}
        </section>

        {/* CTA Section */}
        <section className="max-w-7xl mx-auto px-6 pb-16">
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-12 text-center">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-secondary-500 to-primary-400 bg-clip-text text-transparent">
              Are You an Event Organizer?
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Stream your events to a global audience. Offer free streaming,
              paid access, or invite-only events. Get started today!
            </p>
            <div className="flex gap-4 justify-center">
              <Button
                as={Link}
                href="/login"
                size="lg"
                color="primary"
                className="font-semibold text-lg px-8"
              >
                Start Streaming
              </Button>
              <Button
                as={Link}
                href="/login"
                size="lg"
                variant="bordered"
                className="font-semibold text-lg px-8"
              >
                Learn More
              </Button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-white/95 backdrop-blur-sm mt-8 border-t">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center">
                <Logo width={120} height={60} alt="CloudWatch Live" />
              </div>
              <div className="text-sm text-gray-600">
                © 2025 CloudWatch Live. All rights reserved.
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
