"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade, Pagination } from "swiper/modules";
import Link from "next/link";

// Import Swiper styles
import "swiper/css";
import "swiper/css/effect-fade";
import "swiper/css/pagination";

export function HeroSlider() {
  return (
    <section className="relative bg-gray-900">
      <Swiper
        modules={[Autoplay, EffectFade, Pagination]}
        effect="fade"
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
        }}
        pagination={{
          clickable: true,
        }}
        loop
        className="h-[650px] bg-gray-900"
      >
        {/* Slide 1 - Modern Office */}
        <SwiperSlide>
          <div className="h-full w-full bg-[#1a1a1a] bg-cover bg-center bg-no-repeat relative">
            <div
              className="absolute inset-0 bg-gradient-to-br from-gray-900/95 via-gray-800/90 to-gray-900/95"
              style={{ mixBlendMode: "multiply" }}
            />
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: "url(/images/hero-developer-workspace.jpg)",
                backgroundSize: "cover",
                backgroundPosition: "center",
                filter: "grayscale(100%)",
                opacity: 0.15,
              }}
            />
            <div className="relative z-10 h-full flex items-center justify-center">
              <div className="text-center px-4 max-w-4xl">
                <h1 className="text-white text-3xl md:text-5xl lg:text-6xl font-bold mb-4 font-josefin leading-tight">
                  Transform Your
                  <br className="hidden sm:block" />
                  <span className="text-brand-yellow">Digital Presence</span>
                </h1>
                <p className="text-white text-base md:text-lg mb-6 md:mb-8 font-roboto-slab max-w-2xl mx-auto">
                  Full-service digital agency specializing in web development,
                  social media management, and strategic digital marketing.
                </p>
                <div className="flex gap-4 justify-center">
                  <Link
                    href="/quote"
                    className="inline-block bg-brand-green text-white font-bold px-8 py-3 rounded hover:bg-brand-green/90 transition-colors"
                  >
                    Get a Quote
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </SwiperSlide>

        {/* Slide 2 - Developer Workspace */}
        <SwiperSlide>
          <div className="h-full w-full bg-[#1a1a1a] bg-cover bg-center bg-no-repeat relative">
            <div
              className="absolute inset-0 bg-gradient-to-br from-gray-900/95 via-gray-800/90 to-gray-900/95"
              style={{ mixBlendMode: "multiply" }}
            />
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: "url(/images/hero-developer-workspace.jpg)",
                backgroundSize: "cover",
                backgroundPosition: "center",
                filter: "grayscale(100%)",
                opacity: 0.15,
              }}
            />
            <div className="relative z-10 h-full flex items-center justify-center">
              <div className="text-center px-4 max-w-4xl">
                <h1 className="text-white text-3xl md:text-5xl lg:text-6xl font-bold mb-4 font-josefin leading-tight">
                  Custom Web Development
                  <br className="hidden sm:block" />
                  <span className="text-brand-yellow">Built for Growth</span>
                </h1>
                <p className="text-white text-base md:text-lg mb-6 md:mb-8 font-roboto-slab max-w-2xl mx-auto">
                  Modern, responsive websites and applications built with
                  cutting-edge technology for optimal performance.
                </p>
                <div className="flex gap-4 justify-center">
                  <Link
                    href="/quote"
                    className="inline-block bg-brand-green text-white font-bold px-8 py-3 rounded hover:bg-brand-green/90 transition-colors"
                  >
                    Get a Quote
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </SwiperSlide>

        {/* Slide 3 - Social Media */}
        <SwiperSlide>
          <div className="h-full w-full bg-[#1a1a1a] bg-cover bg-center bg-no-repeat relative">
            <div
              className="absolute inset-0 bg-gradient-to-br from-gray-900/95 via-gray-800/90 to-gray-900/95"
              style={{ mixBlendMode: "multiply" }}
            />
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: "url(/images/hero-developer-workspace.jpg)",
                backgroundSize: "cover",
                backgroundPosition: "center",
                filter: "grayscale(100%)",
                opacity: 0.15,
              }}
            />
            <div className="relative z-10 h-full flex items-center justify-center">
              <div className="text-center px-4 max-w-4xl">
                <h1 className="text-white text-3xl md:text-5xl lg:text-6xl font-bold mb-4 font-josefin leading-tight">
                  Social Media That
                  <br className="hidden sm:block" />
                  <span className="text-brand-yellow">Drives Results</span>
                </h1>
                <p className="text-white text-base md:text-lg mb-6 md:mb-8 font-roboto-slab max-w-2xl mx-auto">
                  Strategic content creation and management across all major
                  platforms to grow your online presence.
                </p>
                <div className="flex gap-4 justify-center">
                  <Link
                    href="/quote"
                    className="inline-block bg-brand-green text-white font-bold px-8 py-3 rounded hover:bg-brand-green/90 transition-colors"
                  >
                    Get a Quote
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </SwiperSlide>
      </Swiper>
    </section>
  );
}
