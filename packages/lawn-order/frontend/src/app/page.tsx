"use client";

import { HeroSlider } from "@/components/HeroSlider";
import { AddressSection } from "@/components/AddressSection";
import ParallaxGap from "@/components/layout/ParallaxGap";
import { Icon } from "@iconify/react";
import Link from "next/link";

export default function HomePage() {
  const services = [
    {
      icon: "mdi:lawn-mower",
      title: "Lawn Mowing",
      description:
        "Professional mowing to keep your rental property looking pristine for guest arrivals",
    },
    {
      icon: "mdi:grass",
      title: "Whipper Snippering",
      description:
        "Neat edges and hard-to-reach areas for that professional finish",
    },
    {
      icon: "mdi:tree",
      title: "Ground Level Pruning",
      description: "Keep shrubs and hedges tidy and guest-ready",
    },
    {
      icon: "mdi:delete-variant",
      title: "Garden Waste Removal",
      description: "Complete cleanup and removal of all garden waste",
    },
    {
      icon: "mdi:home-roof",
      title: "Gutter Cleaning",
      description:
        "Prevent water damage and maintain your property's condition",
    },
    {
      icon: "mdi:water-pump",
      title: "Pressure Washing",
      description:
        "Clean driveways, paths, and outdoor areas to impress your guests",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Slider */}
      <HeroSlider />

      {/* Address/Contact Section */}
      <AddressSection />

      {/* About Section with Parallax Background */}
      <ParallaxGap
        image="/images/hero-garden-maintenance.png"
        minHeight="auto"
        overlay="linear-gradient(0deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.7) 100%)"
      >
        <section className="py-20 w-full">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-4xl font-bold mb-2 font-josefin text-white">
                About Tommy's Law'n Order
              </h2>
              <div className="w-16 h-1 bg-white mb-6 mx-auto"></div>
              <p className="mb-4 font-roboto-slab text-gray-200 leading-relaxed">
                Supporting meaningful employment - Tommy is a dedicated young
                man on the autism spectrum building his future through honest,
                quality work.
              </p>
              <p className="mb-8 font-roboto-slab text-gray-200 leading-relaxed">
                Tommy's carers are qualified horticulturalists and 4.98★ rated
                Airbnb hosts who understand exactly what your rental property
                needs to get those 5-star reviews.
              </p>
              <div className="grid grid-cols-2 gap-3 max-w-2xl mx-auto">
                <div className="flex items-center gap-2 justify-center">
                  <i className="text-brand-green text-lg">✓</i>
                  <span className="font-roboto-slab text-sm text-white">
                    Qualified Horticulturalists
                  </span>
                </div>
                <div className="flex items-center gap-2 justify-center">
                  <i className="text-brand-green text-lg">✓</i>
                  <span className="font-roboto-slab text-sm text-white">
                    4.98★ Airbnb Hosts
                  </span>
                </div>
                <div className="flex items-center gap-2 justify-center">
                  <i className="text-brand-green text-lg">✓</i>
                  <span className="font-roboto-slab text-sm text-white">
                    Local to Devonport
                  </span>
                </div>
                <div className="flex items-center gap-2 justify-center">
                  <i className="text-brand-green text-lg">✓</i>
                  <span className="font-roboto-slab text-sm text-white">
                    Reliable Service
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </ParallaxGap>

      {/* Services Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          {/* Section Title */}
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4 font-josefin">
              Our Services
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto mb-6 font-roboto-slab">
              Everything you need to keep your Airbnb, Booking.com, and VRBO
              rental property looking perfect for every guest arrival in the
              Devonport area.
            </p>
            <div className="w-16 h-1 bg-brand-green mx-auto"></div>
          </div>

          {/* Services Grid - Circular Icon Boxes */}
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {services.map((service, index) => (
              <div key={index} className="text-center animate-fadeInUp mb-8">
                {/* Circular Bordered Icon */}
                <div className="w-32 h-32 rounded-full border-4 border-gray-300 flex items-center justify-center mx-auto mb-6 hover:border-brand-green transition-colors bg-white">
                  <Icon
                    icon={service.icon}
                    className="w-16 h-16 text-brand-green"
                  />
                </div>
                {/* Title */}
                <h4 className="text-lg font-semibold text-gray-800 mb-3 font-roboto-slab uppercase tracking-wide">
                  {service.title}
                </h4>
                {/* Description */}
                <p className="text-gray-600 font-roboto-slab text-sm leading-relaxed">
                  {service.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section with Parallax Background */}
      <ParallaxGap
        image="/images/hero-pool-garden.png"
        minHeight="auto"
        overlay="linear-gradient(0deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.7) 100%)"
      >
        <section className="py-20 w-full">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-left mb-12">
                <h2 className="text-3xl font-bold text-white mb-2 font-josefin">
                  Why Holiday Rental Hosts Choose Us
                </h2>
                <div className="w-16 h-1 bg-brand-green mb-6"></div>
                <p className="text-gray-200 font-roboto-slab leading-relaxed">
                  We understand the unique needs of Airbnb, Booking.com, and
                  VRBO hosts. Your property needs to look perfect for every
                  guest arrival.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
                {[
                  {
                    icon: "✓",
                    title: "Backed by 4.98★ Airbnb Hosts",
                    desc: "Tommy's carers are experienced hosts who understand what your property needs",
                  },
                  {
                    icon: "✓",
                    title: "Qualified Horticulturalists",
                    desc: "Professional expertise ensuring proper care from people who know plants",
                  },
                  {
                    icon: "✓",
                    title: "Local to Devonport",
                    desc: "Servicing postcodes 7310 & 7306 - we're your local neighbours",
                  },
                  {
                    icon: "✓",
                    title: "Supporting Meaningful Employment",
                    desc: "Tommy is building his future through honest work",
                  },
                  {
                    icon: "✓",
                    title: "Reliable & Consistent",
                    desc: "Scheduled maintenance between bookings so property is always guest-ready",
                  },
                  {
                    icon: "✓",
                    title: "Fair, Honest Pricing",
                    desc: "Transparent pricing with no hidden fees - just quality work at a fair price",
                  },
                ].map((item, index) => (
                  <div key={index} className="flex gap-3 items-start">
                    <div className="flex-shrink-0">
                      <i className="text-brand-green text-xl">{item.icon}</i>
                    </div>
                    <div>
                      <h6 className="font-bold text-white mb-1 font-roboto-slab">
                        {item.title}
                      </h6>
                      <p className="text-gray-200 text-sm font-roboto-slab leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </ParallaxGap>

      {/* CTA Section with curved edges */}
      <section className="relative -mt-[1px]">
        {/* Wave curve at top */}
        <div
          className="absolute top-0 left-0 right-0 w-full overflow-visible leading-[0] z-10"
          style={{ transform: "translateY(-100%)" }}
        >
          <svg
            className="relative block w-full h-[60px]"
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
          >
            <path d="M0,120 C300,20 900,20 1200,120 Z" fill="#98bc24" />
          </svg>
        </div>

        <div className="py-20 bg-brand-green text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl font-bold mb-6 font-josefin">
              Keep Your Rental Property Guest-Ready
            </h2>
            <p className="text-xl mb-4 font-roboto-slab">
              Servicing Airbnb, Booking.com & VRBO properties in Devonport area
            </p>
            <p className="text-lg mb-8 text-white/90 font-roboto-slab">
              Get a free quote for regular maintenance or one-off jobs
            </p>
            <Link
              href="/quote"
              className="inline-block bg-white text-brand-green font-bold px-10 py-4 rounded hover:bg-gray-100 transition-colors text-lg"
            >
              Get a Free Quote
            </Link>
          </div>
        </div>

        {/* Wave curve at bottom */}
        <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-[0]">
          <svg
            className="relative block w-full h-[60px]"
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
          >
            <path
              d="M0,0 C300,100 900,100 1200,0 L1200,120 L0,120 Z"
              fill="#282828"
            />
          </svg>
        </div>
      </section>
    </div>
  );
}
