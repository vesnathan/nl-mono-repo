"use client";

import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade, Pagination } from 'swiper/modules';
import Link from 'next/link';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/pagination';

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
        loop={true}
        className="h-[650px] bg-gray-900"
      >
        {/* Slide 1 - Garden Maintenance */}
        <SwiperSlide>
          <div
            className="h-full w-full bg-gray-900 bg-cover bg-center bg-no-repeat relative"
            style={{ backgroundImage: 'url(/images/hero-garden-maintenance.png)' }}
          >
            <div className="absolute inset-0 bg-black/40"></div>
            <div className="relative z-10 h-full flex items-center justify-center">
              <div className="text-center px-4 max-w-4xl">
                <h1 className="text-white text-3xl md:text-5xl lg:text-6xl font-bold mb-4 font-josefin leading-tight">
                  Keep Your Rental Property<br className="hidden sm:block" />
                  <span className="text-brand-yellow">Guest-Ready</span>
                </h1>
                <p className="text-white text-base md:text-lg mb-6 md:mb-8 font-roboto-slab max-w-2xl mx-auto">
                  Servicing Devonport & surrounds (postcodes 7310 & 7306).
                  Professional maintenance backed by qualified horticulturalists and 4.98★ Airbnb hosts.
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

        {/* Slide 2 - Pool & Garden */}
        <SwiperSlide>
          <div
            className="h-full w-full bg-gray-900 bg-cover bg-center bg-no-repeat relative"
            style={{ backgroundImage: 'url(/images/hero-pool-garden.png)' }}
          >
            <div className="absolute inset-0 bg-black/40"></div>
            <div className="relative z-10 h-full flex items-center justify-center">
              <div className="text-center px-4 max-w-4xl">
                <h1 className="text-white text-3xl md:text-5xl lg:text-6xl font-bold mb-4 font-josefin leading-tight">
                  Professional Garden Care<br className="hidden sm:block" />
                  <span className="text-brand-yellow">For Your Property</span>
                </h1>
                <p className="text-white text-base md:text-lg mb-6 md:mb-8 font-roboto-slab max-w-2xl mx-auto">
                  Quality maintenance between guest bookings. Supporting meaningful employment with Tommy's Law'n Order.
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

        {/* Slide 3 - Backyard Weeding */}
        <SwiperSlide>
          <div
            className="h-full w-full bg-gray-900 bg-cover bg-center bg-no-repeat relative"
            style={{ backgroundImage: 'url(/images/hero2_backyard_weeding_1872x800.jpg)' }}
          >
            <div className="absolute inset-0 bg-black/40"></div>
            <div className="relative z-10 h-full flex items-center justify-center">
              <div className="text-center px-4 max-w-4xl">
                <h1 className="text-white text-3xl md:text-5xl lg:text-6xl font-bold mb-4 font-josefin leading-tight">
                  Complete Garden Solutions<br className="hidden sm:block" />
                  <span className="text-brand-yellow">For Airbnb Hosts</span>
                </h1>
                <p className="text-white text-base md:text-lg mb-6 md:mb-8 font-roboto-slab max-w-2xl mx-auto">
                  From lawn mowing to garden waste removal - we handle it all so you can focus on your guests.
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
