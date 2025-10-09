"use client";

import Image from "next/image";
import Link from "next/link";
import { Button, Card, CardBody } from "@nextui-org/react";
import LoginBackground from "@/assets/images/login-bg.png";
import Logo from "@/assets/images/logo/logo.png";

// Placeholder event data
const PLACEHOLDER_EVENTS = [
  {
    id: 1,
    title: "Summer Music Festival 2025",
    location: "Sydney, Australia",
    date: "Dec 15-17, 2025",
    price: "$299",
    image:
      "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=500&h=400&fit=crop",
  },
  {
    id: 2,
    title: "Tech Conference Asia",
    location: "Singapore",
    date: "Jan 20-22, 2026",
    price: "$599",
    image:
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=500&h=400&fit=crop",
  },
  {
    id: 3,
    title: "Art & Design Expo",
    location: "Melbourne, Australia",
    date: "Nov 5-7, 2025",
    price: "$149",
    image:
      "https://images.unsplash.com/photo-1531058020387-3be344556be6?w=500&h=400&fit=crop",
  },
  {
    id: 4,
    title: "Food & Wine Festival",
    location: "Adelaide, Australia",
    date: "Oct 28-30, 2025",
    price: "$199",
    image:
      "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500&h=400&fit=crop",
  },
  {
    id: 5,
    title: "Sports Championship Finals",
    location: "Brisbane, Australia",
    date: "Dec 1-3, 2025",
    price: "$399",
    image:
      "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=500&h=400&fit=crop",
  },
  {
    id: 6,
    title: "Comedy Night Special",
    location: "Perth, Australia",
    date: "Nov 18, 2025",
    price: "$89",
    image:
      "https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=500&h=400&fit=crop",
  },
  {
    id: 7,
    title: "Gaming Convention",
    location: "Auckland, New Zealand",
    date: "Jan 10-12, 2026",
    price: "$249",
    image:
      "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=500&h=400&fit=crop",
  },
  {
    id: 8,
    title: "Wellness Retreat Weekend",
    location: "Gold Coast, Australia",
    date: "Nov 25-27, 2025",
    price: "$449",
    image:
      "https://images.unsplash.com/photo-1545389336-cf090694435e?w=500&h=400&fit=crop",
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
              Discover Amazing Events
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Join thousands of event-goers experiencing unforgettable moments.
              Find your next adventure today.
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
          <h2 className="text-3xl font-bold text-white mb-8 drop-shadow-lg">
            Popular Events
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {PLACEHOLDER_EVENTS.map((event) => (
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
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                      {event.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-1">
                      {event.location}
                    </p>
                    <p className="text-sm text-gray-500 mb-3">{event.date}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-primary-500">
                        {event.price}
                      </span>
                      <Button
                        size="sm"
                        color="primary"
                        variant="flat"
                        className="font-semibold"
                      >
                        View Details
                      </Button>
                    </div>
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
              Ready to Join?
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Create your account today and start discovering events near you.
              It&apos;s free to join!
            </p>
            <div className="flex gap-4 justify-center">
              <Button
                as={Link}
                href="/login"
                size="lg"
                color="primary"
                className="font-semibold text-lg px-8"
              >
                Sign Up Now
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
