"use client";

import MockEventsRaw from "@cwl/dev-mocks/mockEvents.json"; // canonical dev-mocks
import Image from "next/image";
import Link from "next/link";
import Logo from "@/components/common/Logo";
import { Button, Card, CardBody } from "@nextui-org/react";
// Use public image path to avoid Next's sharp native dependency during local build.
// Ensure the image is copied to packages/cloudwatchlive/frontend/public/images/login-bg.png
const LoginBackground = "/images/login-bg.png";

const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1496307042754-b4aa456c4a2d?w=800&h=500&auto=format&fit=crop&q=60";

// Derive sections from MOCK_EVENTS
// Helper: format a start/end ISO range into a human string
function formatRange(start?: string, end?: string) {
  if (!start) return "";
  const s = new Date(start);
  const e = end ? new Date(end) : null;
  // If no end or same day -> show local date/time
  if (!e) return s.toLocaleString();
  const msInDay = 24 * 60 * 60 * 1000;
  const dayDiff = Math.round(
    (e.setHours(0, 0, 0, 0) - s.setHours(0, 0, 0, 0)) / msInDay,
  );
  // If same day, show times
  if (dayDiff === 0)
    return `${s.toLocaleDateString()} ${s.toLocaleTimeString()} - ${new Date(end!).toLocaleTimeString()}`;
  // Multi-day but cap under two weeks in UI — format date range
  return `${s.toLocaleDateString()} — ${e.toLocaleDateString()}`;
}

interface MockEventOwner {
  ownerCompany?: string;
  company?: string;
}

interface MockEvent {
  id: string;
  title: string;
  image?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  accessType: "free" | "free-register" | "paid" | "invite-paid";
  requiresRegistration?: boolean;
  price?: string;
  eventOwner?: MockEventOwner;
}

const MockEventsData: MockEvent[] = MockEventsRaw as unknown as MockEvent[];

function getOwnerCompany(event: MockEvent) {
  // eventOwner.ownerCompany is canonical; tolerate alternative shapes
  type MaybeOwner = { ownerCompany?: string; company?: string } | undefined;
  const owner = event.eventOwner as MaybeOwner;
  return owner?.ownerCompany ?? owner?.company ?? "";
}
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

const FREE_EVENTS: MockEvent[] = MockEventsData.filter((e: MockEvent) =>
  ["free", "free-register"].includes(e.accessType),
).slice(0, 8);

interface MockEventOwner {
  ownerCompany?: string;
  company?: string;
}

interface MockEvent {
  id: string;
  title: string;
  image?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  accessType: "free" | "free-register" | "paid" | "invite-paid";
  requiresRegistration?: boolean;
  price?: string;
  eventOwner?: MockEventOwner;
}

const PAID_EVENTS: MockEvent[] = MockEventsData.filter(
  (e: MockEvent) => e.accessType === "paid" || e.accessType === "invite-paid",
).slice(0, 8);

const LIMITED_LIVE_EVENTS = LIVE_EVENTS.slice(0, 8);

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
              <Card
                key={event.id}
                className="bg-white hover:shadow-2xl transition-all duration-300 hover:scale-105 border-2 border-red-500"
              >
                <CardBody className="p-0 flex flex-col h-full">
                  <div className="relative w-full h-48">
                    <Image
                      src={event.image ?? PLACEHOLDER_IMAGE}
                      alt={event.title}
                      fill
                      className="object-cover rounded-t-lg"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    />
                    <div className="absolute top-2 left-2 flex gap-2">
                      <div className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        LIVE
                      </div>
                      {event.requiresRegistration && (
                        <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                          REGISTER
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="p-4 flex flex-col flex-grow">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                      {event.title}
                    </h3>
                    <p className="text-xs text-gray-500 mb-1">
                      by {getOwnerCompany(event)}
                    </p>
                    <p className="text-sm text-gray-600 mb-1">
                      {event.location}
                    </p>
                    <p className="text-sm text-red-500 font-semibold mb-3">
                      Streaming Now
                    </p>
                    <Button
                      as={Link}
                      href={`/event/${event.id}`}
                      size="sm"
                      color="danger"
                      className="font-semibold w-full mt-auto"
                    >
                      {event.requiresRegistration
                        ? "Register & Watch"
                        : "Watch Live"}
                    </Button>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
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
              <Card
                key={event.id}
                className="bg-white hover:shadow-2xl transition-all duration-300 hover:scale-105"
              >
                <CardBody className="p-0 flex flex-col h-full">
                  <div className="relative w-full h-48">
                    <Image
                      src={event.image ?? PLACEHOLDER_IMAGE}
                      alt={event.title}
                      fill
                      className="object-cover rounded-t-lg"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    />
                    <div className="absolute top-2 left-2 flex gap-2">
                      <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                        FREE
                      </div>
                      {event.requiresRegistration && (
                        <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                          REGISTER
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="p-4 flex flex-col flex-grow">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                      {event.title}
                    </h3>
                    <p className="text-xs text-gray-500 mb-1">
                      by {getOwnerCompany(event)}
                    </p>
                    <p className="text-sm text-gray-600 mb-1">
                      {event.location}
                    </p>
                    <p className="text-sm text-gray-500 mb-3">
                      {formatRange(event.startDate, event.endDate)}
                    </p>
                    <Button
                      as={Link}
                      href={`/event/${event.id}`}
                      size="sm"
                      color="primary"
                      variant="flat"
                      className="font-semibold w-full mt-auto"
                    >
                      {event.requiresRegistration
                        ? "Register to Watch"
                        : "Remind Me"}
                    </Button>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
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
              <Card
                key={event.id}
                className="bg-white hover:shadow-2xl transition-all duration-300 hover:scale-105 border-2 border-yellow-500"
              >
                <CardBody className="p-0 flex flex-col h-full">
                  <div className="relative w-full h-48">
                    <Image
                      src={event.image ?? PLACEHOLDER_IMAGE}
                      alt={event.title}
                      fill
                      className="object-cover rounded-t-lg"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    />
                    <div className="absolute top-2 left-2 flex gap-2">
                      <div className="bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                        PAID
                      </div>
                    </div>
                    <div className="absolute top-2 right-2 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-bold">
                      {event.price}
                    </div>
                  </div>
                  <div className="p-4 flex flex-col flex-grow">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                      {event.title}
                    </h3>
                    <p className="text-xs text-gray-500 mb-1">
                      by {getOwnerCompany(event)}
                    </p>
                    <p className="text-sm text-gray-600 mb-1">
                      {event.location}
                    </p>
                    <p className="text-sm text-gray-500 mb-3">
                      {event.startDate
                        ? new Date(event.startDate).toLocaleString()
                        : ""}
                    </p>
                    <Button
                      as={Link}
                      href={`/event/${event.id}`}
                      size="sm"
                      color="warning"
                      className="font-semibold w-full mt-auto"
                    >
                      Purchase Ticket
                    </Button>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
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
