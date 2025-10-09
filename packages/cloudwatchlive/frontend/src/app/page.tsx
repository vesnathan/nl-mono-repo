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
  isLive: boolean; // Whether event is currently streaming live
  price?: string; // Only for paid events
  image: string;
  eventOwner: {
    name: string;
    company: string;
  };
}

// Events currently live streaming
const LIVE_EVENTS: Event[] = [
  {
    id: 101,
    title: "Tech Keynote 2025 - LIVE",
    location: "San Francisco, USA",
    date: "Oct 9, 2025 - Now",
    accessType: "free",
    requiresRegistration: false,
    isLive: true,
    image:
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=500&h=400&fit=crop",
    eventOwner: {
      name: "Tech Summit",
      company: "Global Tech Events",
    },
  },
  {
    id: 102,
    title: "Live Jazz Concert",
    location: "New Orleans, USA",
    date: "Oct 9, 2025 - Now",
    accessType: "free",
    requiresRegistration: true,
    isLive: true,
    image:
      "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=500&h=400&fit=crop",
    eventOwner: {
      name: "Jazz Masters",
      company: "New Orleans Music Hall",
    },
  },
];

// All free events (combined)
const FREE_EVENTS: Event[] = [
  {
    id: 1,
    title: "Summer Music Festival 2025",
    location: "Sydney, Australia",
    date: "Dec 15-17, 2025",
    accessType: "free",
    requiresRegistration: false,
    isLive: false,
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
    isLive: false,
    image:
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=500&h=400&fit=crop",
    eventOwner: {
      name: "Sarah Lee",
      company: "Tech Events Asia",
    },
  },
  {
    id: 3,
    title: "Art & Design Expo",
    location: "Melbourne, Australia",
    date: "Nov 5-7, 2025",
    accessType: "free",
    requiresRegistration: true,
    isLive: false,
    image:
      "https://images.unsplash.com/photo-1531058020387-3be344556be6?w=500&h=400&fit=crop",
    eventOwner: {
      name: "Emma Wilson",
      company: "Creative Spaces Events",
    },
  },
  {
    id: 4,
    title: "Food & Wine Festival",
    location: "Adelaide, Australia",
    date: "Oct 28-30, 2025",
    accessType: "free",
    requiresRegistration: true,
    isLive: false,
    image:
      "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500&h=400&fit=crop",
    eventOwner: {
      name: "Marco Rossi",
      company: "Gourmet Events Co",
    },
  },
  {
    id: 5,
    title: "Community Sports Day",
    location: "Brisbane, Australia",
    date: "Dec 1, 2025",
    accessType: "free",
    requiresRegistration: false,
    isLive: false,
    image:
      "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=500&h=400&fit=crop",
    eventOwner: {
      name: "David Chen",
      company: "Brisbane Sports Network",
    },
  },
  {
    id: 6,
    title: "Comedy Night Special",
    location: "Perth, Australia",
    date: "Nov 18, 2025",
    accessType: "free",
    requiresRegistration: false,
    isLive: false,
    image:
      "https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=500&h=400&fit=crop",
    eventOwner: {
      name: "Lisa Brown",
      company: "Laugh Out Loud Productions",
    },
  },
  {
    id: 7,
    title: "Gaming Convention Keynote",
    location: "Auckland, New Zealand",
    date: "Jan 10, 2026",
    accessType: "free",
    requiresRegistration: true,
    isLive: false,
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
    isLive: false,
    image:
      "https://images.unsplash.com/photo-1545389336-cf090694435e?w=500&h=400&fit=crop",
    eventOwner: {
      name: "Sophie Green",
      company: "Mindful Living Events",
    },
  },
];

// Paid events (all require registration)
const PAID_EVENTS: Event[] = [
  {
    id: 201,
    title: "Premium Tech Summit 2025",
    location: "San Francisco, USA",
    date: "Nov 10-12, 2025",
    accessType: "paid",
    requiresRegistration: true,
    isLive: false,
    price: "$299",
    image:
      "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=500&h=400&fit=crop",
    eventOwner: {
      name: "Tech Leaders",
      company: "Silicon Valley Events",
    },
  },
  {
    id: 202,
    title: "Exclusive VIP Concert - Beyoncé",
    location: "Los Angeles, USA",
    date: "Dec 5, 2025",
    accessType: "paid",
    requiresRegistration: true,
    isLive: false,
    price: "$149",
    image:
      "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=500&h=400&fit=crop",
    eventOwner: {
      name: "Live Nation",
      company: "Premium Music Events",
    },
  },
  {
    id: 203,
    title: "Business Masterclass Series",
    location: "London, UK",
    date: "Jan 15-17, 2026",
    accessType: "paid",
    requiresRegistration: true,
    isLive: false,
    price: "$499",
    image:
      "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=500&h=400&fit=crop",
    eventOwner: {
      name: "Business Elite",
      company: "Executive Events UK",
    },
  },
  {
    id: 204,
    title: "Professional Photography Workshop",
    location: "Tokyo, Japan",
    date: "Dec 18-20, 2025",
    accessType: "paid",
    requiresRegistration: true,
    isLive: false,
    price: "$199",
    image:
      "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=500&h=400&fit=crop",
    eventOwner: {
      name: "Photo Masters",
      company: "Creative Workshop Japan",
    },
  },
  {
    id: 205,
    title: "Gourmet Cooking Masterclass",
    location: "Paris, France",
    date: "Nov 28-30, 2025",
    accessType: "paid",
    requiresRegistration: true,
    isLive: false,
    price: "$349",
    image:
      "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=500&h=400&fit=crop",
    eventOwner: {
      name: "Chef Antoine",
      company: "Culinary Excellence Paris",
    },
  },
  {
    id: 206,
    title: "Fitness & Wellness Bootcamp",
    location: "Bali, Indonesia",
    date: "Jan 8-14, 2026",
    accessType: "paid",
    requiresRegistration: true,
    isLive: false,
    price: "$599",
    image:
      "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=500&h=400&fit=crop",
    eventOwner: {
      name: "Fitness Pro",
      company: "Wellness Retreats Bali",
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
            {LIVE_EVENTS.map((event) => (
              <Card
                key={event.id}
                className="bg-white hover:shadow-2xl transition-all duration-300 hover:scale-105 border-2 border-red-500"
              >
                <CardBody className="p-0 flex flex-col h-full">
                  <div className="relative w-full h-48">
                    <Image
                      src={event.image}
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
                      by {event.eventOwner.company}
                    </p>
                    <p className="text-sm text-gray-600 mb-1">
                      {event.location}
                    </p>
                    <p className="text-sm text-red-500 font-semibold mb-3">
                      Streaming Now
                    </p>
                    <Button
                      as={event.requiresRegistration ? Link : undefined}
                      href={event.requiresRegistration ? "/login" : undefined}
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
                      src={event.image}
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
                      by {event.eventOwner.company}
                    </p>
                    <p className="text-sm text-gray-600 mb-1">
                      {event.location}
                    </p>
                    <p className="text-sm text-gray-500 mb-3">{event.date}</p>
                    <Button
                      as={event.requiresRegistration ? Link : undefined}
                      href={event.requiresRegistration ? "/login" : undefined}
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
                      src={event.image}
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
