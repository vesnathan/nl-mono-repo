"use client";

import { HeroSlider } from "@/components/HeroSlider";
import { AddressSection } from "@/components/AddressSection";
import ParallaxGap from "@/components/layout/ParallaxGap";
import { Icon } from "@iconify/react";
import Link from "next/link";

export default function HomePage() {
  const services = [
    {
      icon: "mdi:web",
      title: "Web Development",
      description:
        "Custom websites and web applications built with modern technologies for optimal performance",
    },
    {
      icon: "mdi:cellphone-link",
      title: "Responsive Design",
      description:
        "Mobile-first designs that look stunning on every device and screen size",
    },
    {
      icon: "mdi:cart",
      title: "E-Commerce Solutions",
      description: "Complete online stores with payment integration and inventory management",
    },
    {
      icon: "mdi:instagram",
      title: "Social Media Management",
      description: "Strategic content creation and management across all major platforms",
    },
    {
      icon: "mdi:google-ads",
      title: "Digital Marketing",
      description:
        "SEO, PPC, and content marketing to grow your online presence and drive results",
    },
    {
      icon: "mdi:palette",
      title: "Brand Identity",
      description:
        "Logo design, brand guidelines, and visual assets that make your business stand out",
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
        image="/images/hero-team-collaboration.jpg"
        minHeight="auto"
        overlay="linear-gradient(0deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.7) 100%)"
      >
        <section className="py-20 w-full">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-4xl font-bold mb-2 font-josefin text-white">
                About Loud'n'Clear Digital
              </h2>
              <div className="w-16 h-1 bg-white mb-6 mx-auto"></div>
              <p className="mb-4 font-roboto-slab text-gray-200 leading-relaxed">
                We're a full-service digital agency passionate about helping businesses
                thrive in the online world. From stunning websites to strategic social
                media campaigns, we craft digital experiences that connect with your audience.
              </p>
              <p className="mb-8 font-roboto-slab text-gray-200 leading-relaxed">
                With years of experience in web development, design, and digital marketing,
                we understand what it takes to build a strong online presence that drives
                real business results.
              </p>
              <div className="grid grid-cols-2 gap-3 max-w-2xl mx-auto">
                <div className="flex items-center gap-2 justify-center">
                  <i className="text-brand-green text-lg">✓</i>
                  <span className="font-roboto-slab text-sm text-white">
                    Modern Technologies
                  </span>
                </div>
                <div className="flex items-center gap-2 justify-center">
                  <i className="text-brand-green text-lg">✓</i>
                  <span className="font-roboto-slab text-sm text-white">
                    Proven Results
                  </span>
                </div>
                <div className="flex items-center gap-2 justify-center">
                  <i className="text-brand-green text-lg">✓</i>
                  <span className="font-roboto-slab text-sm text-white">
                    Local Business Focus
                  </span>
                </div>
                <div className="flex items-center gap-2 justify-center">
                  <i className="text-brand-green text-lg">✓</i>
                  <span className="font-roboto-slab text-sm text-white">
                    Ongoing Support
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
              Comprehensive digital solutions to elevate your brand and grow your
              business in the digital landscape.
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
        image="/images/hero-analytics-dashboard.jpg"
        minHeight="auto"
        overlay="linear-gradient(0deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.7) 100%)"
      >
        <section className="py-20 w-full">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-left mb-12">
                <h2 className="text-3xl font-bold text-white mb-2 font-josefin">
                  Why Businesses Choose Loud'n'Clear
                </h2>
                <div className="w-16 h-1 bg-brand-green mb-6"></div>
                <p className="text-gray-200 font-roboto-slab leading-relaxed">
                  We're more than just a service provider - we're your digital
                  growth partner. Here's what sets us apart.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
                {[
                  {
                    icon: "✓",
                    title: "Strategic Approach",
                    desc: "Data-driven strategies tailored to your specific business goals and target audience",
                  },
                  {
                    icon: "✓",
                    title: "Modern Technology Stack",
                    desc: "We use cutting-edge tools and frameworks to build fast, secure, and scalable solutions",
                  },
                  {
                    icon: "✓",
                    title: "Transparent Communication",
                    desc: "Regular updates and clear reporting so you always know what we're working on",
                  },
                  {
                    icon: "✓",
                    title: "Mobile-First Design",
                    desc: "Beautiful, responsive designs that work flawlessly across all devices",
                  },
                  {
                    icon: "✓",
                    title: "Ongoing Support",
                    desc: "We don't disappear after launch - we're here to help your business grow",
                  },
                  {
                    icon: "✓",
                    title: "Results-Focused",
                    desc: "Every decision is driven by measurable outcomes and ROI for your business",
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
              Ready to Grow Your Digital Presence?
            </h2>
            <p className="text-xl mb-4 font-roboto-slab">
              Let's build something amazing together
            </p>
            <p className="text-lg mb-8 text-white/90 font-roboto-slab">
              Get a free consultation and custom quote for your project
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
