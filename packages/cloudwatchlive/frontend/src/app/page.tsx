"use client";

import Image from "next/image";
import Link from "next/link";
import { Button, Card, CardBody } from "@nextui-org/react";
import LoginBackground from "@/assets/images/login-bg.png";
import Logo from "@/assets/images/logo/logo.png";

// Event access types
type EventAccessType = "free" | "paid" | "invite-only";

// Event data structure
interface Event {
  id: number;
  title: string;
  location: string;
  date: string;
  accessType: EventAccessType;
  requiresRegistration: boolean; // Whether user needs to register/login to access
  price?: string; // Only for paid events
  image: string;
  eventOwner: {
    name: string;
    company: string;
  };
}

// Free events that don't require registration - anyone can watch
const FREE_NO_REGISTRATION_EVENTS: Event[] = [
  {
    id: 1,
    title: "Summer Music Festival 2025",
    location: "Sydney, Australia",
    date: "Dec 15-17, 2025",
    accessType: "free",
    requiresRegistration: false,
    image:
      "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=500&h=400&fit=crop",
    eventOwner: {
      name: "John Smith",
      company: "MegaEvents Australia",
    },
  },
  {
    id: 2,
    title: "Tech Conference Asia",
    location: "Singapore",
    date: "Jan 20-22, 2026",
    accessType: "free",
    requiresRegistration: false,
    image:
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=500&h=400&fit=crop",
    eventOwner: {
      name: "Sarah Lee",
      company: "Tech Events Asia",
    },
  },
  {
    id: 3,
    title: "Community Sports Day",
    location: "Brisbane, Australia",
    date: "Dec 1, 2025",
    accessType: "free",
    requiresRegistration: false,
    image:
      "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=500&h=400&fit=crop",
    eventOwner: {
      name: "David Chen",
      company: "Brisbane Sports Network",
    },
  },
  {
    id: 4,
    title: "Comedy Night Special",
    location: "Perth, Australia",
    date: "Nov 18, 2025",
    accessType: "free",
    requiresRegistration: false,
    image:
      "https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=500&h=400&fit=crop",
    eventOwner: {
      name: "Lisa Brown",
      company: "Laugh Out Loud Productions",
    },
  },
];

// Free events that require registration - user must join/login
const FREE_WITH_REGISTRATION_EVENTS: Event[] = [
  {
    id: 5,
    title: "Art & Design Expo",
    location: "Melbourne, Australia",
    date: "Nov 5-7, 2025",
    accessType: "free",
    requiresRegistration: true,
    image:
      "https://images.unsplash.com/photo-1531058020387-3be344556be6?w=500&h=400&fit=crop",
    eventOwner: {
      name: "Emma Wilson",
      company: "Creative Spaces Events",
    },
  },
  {
    id: 6,
    title: "Food & Wine Festival",
    location: "Adelaide, Australia",
    date: "Oct 28-30, 2025",
    accessType: "free",
    requiresRegistration: true,
    image:
      "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500&h=400&fit=crop",
    eventOwner: {
      name: "Marco Rossi",
      company: "Gourmet Events Co",
    },
  },
  {
    id: 7,
    title: "Gaming Convention Keynote",
    location: "Auckland, New Zealand",
    date: "Jan 10, 2026",
    accessType: "free",
    requiresRegistration: true,
    image:
      "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=500&h=400&fit=crop",
    eventOwner: {
      name: "James Taylor",
      company: "GameCon NZ",
    },
  },
  {
    id: 8,
    title: "Wellness Workshop",
    location: "Gold Coast, Australia",
    date: "Nov 25, 2025",
    accessType: "free",
    requiresRegistration: true,
    image:
      "https://images.unsplash.com/photo-1545389336-cf090694435e?w=500&h=400&fit=crop",
    eventOwner: {
      name: "Sophie Green",
      company: "Mindful Living Events",
    },
  },
];

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
              <Image src={Logo} alt="CloudWatch Live" width={150} height={80} />
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
              Watch free live-streamed events from top event management
              companies worldwide. Join thousands experiencing unforgettable
              moments in real-time.
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

        {/* Events Grid */}
        <section className="max-w-7xl mx-auto px-6 pb-16">
          <h2 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
            Free Live Events - No Registration
          </h2>
          <p className="text-white/90 mb-8 drop-shadow-lg">
            Watch these events live for free. No registration required - just
            click and watch!
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {FREE_NO_REGISTRATION_EVENTS.map((event) => (
              <Card
                key={event.id}
                className="bg-white hover:shadow-2xl transition-all duration-300 hover:scale-105"
              >
                <CardBody className="p-0">
                  <div className="relative w-full h-48">
                    <Image
                      src={event.image}
                      alt={event.title}
                      fill
                      className="object-cover rounded-t-lg"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    />
                    <div className="absolute top-2 left-2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                      FREE
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                      {event.title}
                    </h3>
                    <p className="text-xs text-gray-500 mb-1">
                      by {event.eventOwner.company}
                    </p>
                    <p className="text-sm text-gray-600 mb-1">
                      {event.location}
                    </p>
                    <p className="text-sm text-gray-500 mb-3">{event.date}</p>
                    <Button
                      size="sm"
                      color="primary"
                      variant="flat"
                      className="font-semibold w-full"
                    >
                      Watch Now
                    </Button>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </section>

        {/* Events with Registration Section */}
        <section className="max-w-7xl mx-auto px-6 pb-16">
          <h2 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
            Free Events - Registration Required
          </h2>
          <p className="text-white/90 mb-8 drop-shadow-lg">
            These events are free to watch, but you&apos;ll need to create an
            account to register.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {FREE_WITH_REGISTRATION_EVENTS.map((event) => (
              <Card
                key={event.id}
                className="bg-white hover:shadow-2xl transition-all duration-300 hover:scale-105"
              >
                <CardBody className="p-0">
                  <div className="relative w-full h-48">
                    <Image
                      src={event.image}
                      alt={event.title}
                      fill
                      className="object-cover rounded-t-lg"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    />
                    <div className="absolute top-2 left-2 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                      FREE + REGISTRATION
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                      {event.title}
                    </h3>
                    <p className="text-xs text-gray-500 mb-1">
                      by {event.eventOwner.company}
                    </p>
                    <p className="text-sm text-gray-600 mb-1">
                      {event.location}
                    </p>
                    <p className="text-sm text-gray-500 mb-3">{event.date}</p>
                    <Button
                      as={Link}
                      href="/login"
                      size="sm"
                      color="primary"
                      className="font-semibold w-full"
                    >
                      Register to Watch
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
                <Image
                  src={Logo}
                  alt="CloudWatch Live"
                  width={120}
                  height={60}
                />
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
