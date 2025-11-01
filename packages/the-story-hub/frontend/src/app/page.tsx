"use client";

import { Button } from "@nextui-org/react";
import Link from "next/link";
import Image from "next/image";
import { StoriesGrid } from "@/components/stories/StoriesGrid";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { useFeaturedStories, useTrendingStories } from "@/hooks/useStories";

import ParallaxGap from "@/components/layout/ParallaxGap";
import ParallaxSection from "@/components/layout/ParallaxSection";

const CONSTELLATION_IMAGE_URL = "/images/constellation1.webp";

export default function HomePage() {
  const {
    data: featuredData,
    isLoading: featuredLoading,
    error: featuredError,
    refetch: refetchFeatured,
  } = useFeaturedStories(8);

  const {
    data: trendingData,
    isLoading: trendingLoading,
    error: trendingError,
    refetch: refetchTrending,
  } = useTrendingStories(8);

  return (
    <div className="min-h-screen">
      {/* Hero Section - Gap with Background Image and Curved Bottom */}
      <div className="relative z-20">
        <div className="relative overflow-hidden">
          <ParallaxGap
            image="/themes/adventure.jpg"
            minHeight="auto"
            overlay="linear-gradient(0deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.65) 100%)"
          >
            <div className="w-full pt-16 pb-32 px-4">
              <div className="max-w-4xl mx-auto text-center">
                <Image
                  src="/images/logo.png"
                  alt="The Story Hub"
                  width={400}
                  height={70}
                  priority
                  className="mx-auto mb-6"
                />
                <p className="text-xl text-white drop-shadow-lg leading-relaxed">
                  Discover collaborative fiction — One story, Many branches,
                  Infinite possibilities.
                </p>
                <p className="text-xl text-white drop-shadow-lg leading-relaxed">
                  The Choose Your Own Adventure for the collaborative age
                </p>
              </div>
            </div>
          </ParallaxGap>
          {/* Wave curve at bottom */}
          <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-[0]">
            <svg
              className="relative block w-full h-[60px]"
              viewBox="0 0 1200 120"
              preserveAspectRatio="none"
            >
              <path
                d="M0,0 C300,100 900,100 1200,0 L1200,120 L0,120 Z"
                fill="#1a1a1a"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Featured Stories Section - Dark Background */}
      <ParallaxSection
        background="#1a1a1a"
        minHeight="auto"
        className="relative overflow-hidden -mt-32 pt-24 z-10"
      >
        {/* Subtle constellation background */}
        <div
          style={{
            backgroundImage: `url(${CONSTELLATION_IMAGE_URL})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        />
        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-white">
                Featured Stories
              </h2>
              <Link href="/browse?filter=featured">
                <Button
                  variant="bordered"
                  className="text-white border-white hover:bg-white/20"
                >
                  View All
                </Button>
              </Link>
            </div>
            {featuredError ? (
              <ErrorMessage
                message="Failed to load featured stories"
                retry={refetchFeatured}
              />
            ) : featuredLoading ? (
              <LoadingSpinner label="Loading featured stories..." />
            ) : (
              <StoriesGrid stories={featuredData?.items || []} />
            )}
          </div>
        </div>
      </ParallaxSection>

      {/* Gap 2 - Trending with Background */}
      <ParallaxGap
        image="/themes/fantasy.jpg"
        minHeight="auto"
        overlay="linear-gradient(0deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.65) 100%)"
      >
        <div className="w-full pt-40 pb-32 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg">
                Trending Now
              </h2>
              <Link href="/browse">
                <Button
                  variant="bordered"
                  className="text-white border-white hover:bg-white/20"
                >
                  View All
                </Button>
              </Link>
            </div>
            {trendingError ? (
              <ErrorMessage
                message="Failed to load trending stories"
                retry={refetchTrending}
              />
            ) : trendingLoading ? (
              <LoadingSpinner label="Loading trending stories..." />
            ) : (
              <StoriesGrid stories={trendingData?.items || []} />
            )}
          </div>
        </div>
      </ParallaxGap>

      {/* Support Us Section - White Background */}
      <div className="relative -mt-[1px]">
        <ParallaxSection background="#ffffff" minHeight="auto">
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
              <path d="M0,120 C300,20 900,20 1200,120 Z" fill="#ffffff" />
            </svg>
          </div>
          <div className="container mx-auto px-4 py-20 pt-[40px]">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Support The Story Hub
              </h2>
              <p className="text-xl text-gray-700 mb-12 max-w-2xl mx-auto leading-relaxed">
                Help us keep The Story Hub free and accessible for everyone.
                Your support enables us to maintain the platform, add new
                features, and foster a thriving community of storytellers.
              </p>
              <div className="flex gap-6 justify-center items-center">
                {/* Patreon */}
                <a
                  href="https://patreon.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col items-center gap-2 transition-transform hover:scale-110"
                  aria-label="Support on Patreon"
                >
                  <div className="w-16 h-16 rounded-full bg-[#FF424D] flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                    <svg
                      className="w-8 h-8 text-white"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M15.386.524c-4.764 0-8.64 3.876-8.64 8.64 0 4.75 3.876 8.613 8.64 8.613 4.75 0 8.614-3.864 8.614-8.613C24 4.4 20.136.524 15.386.524M.003 23.537h4.22V.524H.003" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    Patreon
                  </span>
                </a>

                {/* Ko-fi */}
                <a
                  href="https://ko-fi.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col items-center gap-2 transition-transform hover:scale-110"
                  aria-label="Support on Ko-fi"
                >
                  <div className="w-16 h-16 rounded-full bg-[#13C3FF] flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                    <svg
                      className="w-8 h-8 text-white"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M23.881 8.948c-.773-4.085-4.859-4.593-4.859-4.593H.723c-.604 0-.679.798-.679.798s-.082 7.324-.022 11.822c.164 2.424 2.586 2.672 2.586 2.672s8.267-.023 11.966-.049c2.438-.426 2.683-2.566 2.658-3.734 4.352.24 7.422-2.831 6.649-6.916zm-11.062 3.511c-1.246 1.453-4.011 3.976-4.011 3.976s-.121.119-.31.023c-.076-.057-.108-.09-.108-.09-.443-.441-3.368-3.049-4.034-3.954-.709-.965-1.041-2.7-.091-3.71.951-1.01 3.005-1.086 4.363.407 0 0 1.565-1.782 3.468-.963 1.904.82 1.832 3.011.723 4.311zm6.173.478c-.928.116-1.682.028-1.682.028V7.284h1.77s1.971.551 1.971 2.638c0 1.913-.985 2.667-2.059 3.015z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    Ko-fi
                  </span>
                </a>

                {/* PayPal */}
                <a
                  href="https://paypal.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col items-center gap-2 transition-transform hover:scale-110"
                  aria-label="Donate via PayPal"
                >
                  <div className="w-16 h-16 rounded-full bg-[#00457C] flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                    <svg
                      className="w-8 h-8 text-white"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    PayPal
                  </span>
                </a>

                {/* GitHub Sponsors */}
                <a
                  href="https://github.com/sponsors"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col items-center gap-2 transition-transform hover:scale-110"
                  aria-label="Sponsor on GitHub"
                >
                  <div className="w-16 h-16 rounded-full bg-[#EA4AAA] flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                    <svg
                      className="w-8 h-8 text-white"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    GitHub
                  </span>
                </a>
              </div>
            </div>
          </div>
        </ParallaxSection>
        {/* Wave curve at bottom */}
        <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-[0]">
          <svg
            className="relative block w-full h-[60px]"
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
          >
            <path
              d="M0,0 C300,100 900,100 1200,0 L1200,120 L0,120 Z"
              fill="#1a1a1a"
            />
          </svg>
        </div>
      </div>

      {/* Explore Fantasy Section - Dark Background */}
      <ParallaxSection
        background="#1a1a1a"
        minHeight="auto"
        className="relative overflow-hidden"
      >
        {/* Subtle constellation background */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: "url(/images/constellation1.webp)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        />
        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            <h2 className="text-5xl font-bold text-white mb-6">
              Explore Fantasy
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
              Dive into magical worlds filled with dragons, wizards, and epic
              quests. Discover enchanting tales and create your own legendary
              adventures.
            </p>
            <Link href="/browse?genre=Fantasy">
              <Button
                size="lg"
                className="bg-white text-brand-purple font-semibold px-10 py-6 text-lg hover:bg-gray-100"
              >
                Browse Fantasy Stories
              </Button>
            </Link>
          </div>
        </div>
      </ParallaxSection>

      {/* Gap 3 - Sci-Fi Background with Explore Sci-Fi */}
      <ParallaxGap
        image="/themes/scifi.jpg"
        minHeight="auto"
        overlay="linear-gradient(0deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.7) 100%)"
      >
        <div className="w-full pt-40 pb-32 px-4">
          <div className="max-w-5xl mx-auto text-center">
            <h2 className="text-5xl font-bold text-white drop-shadow-lg mb-6">
              Explore Sci-Fi
            </h2>
            <p className="text-xl text-white drop-shadow mb-8 max-w-2xl mx-auto leading-relaxed">
              Journey to distant galaxies and future worlds. Experience
              cutting-edge technology, alien civilizations, and explore the
              final frontier.
            </p>
            <Link href="/browse?genre=Sci-Fi">
              <Button
                size="lg"
                className="bg-white text-black font-semibold px-10 py-6 text-lg hover:bg-gray-100"
              >
                Browse Sci-Fi Stories
              </Button>
            </Link>
          </div>
        </div>
      </ParallaxGap>

      {/* Explore Mystery Section - Dark Background */}
      <ParallaxSection
        background="#1a1a1a"
        minHeight="auto"
        className="relative overflow-hidden"
      >
        {/* Subtle constellation background */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: "url(/images/constellation1.webp)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        />
        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            <h2 className="text-5xl font-bold text-white mb-6">
              Explore Mystery
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
              Unravel enigmatic plots and solve thrilling puzzles. Follow the
              clues, uncover secrets, and experience suspenseful storytelling.
            </p>
            <Link href="/browse?genre=Mystery">
              <Button
                size="lg"
                className="bg-white text-brand-orange font-semibold px-10 py-6 text-lg hover:bg-gray-100"
              >
                Browse Mystery Stories
              </Button>
            </Link>
          </div>
        </div>
      </ParallaxSection>

      {/* Gap 4 - How It Works with Background */}
      <ParallaxGap
        image="/themes/mystery.jpg"
        minHeight="auto"
        overlay="linear-gradient(0deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.75) 100%)"
      >
        <div id="how-it-works" className="w-full pt-32 pb-32 px-4">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-16 text-white drop-shadow-lg">
              How It Works
            </h2>
            <div className="grid md:grid-cols-3 gap-12">
              <div className="text-center p-8 bg-black/30 rounded-xl backdrop-blur-sm border border-white/20">
                <h3 className="text-2xl font-semibold mb-4 text-white drop-shadow">
                  Read & Explore
                </h3>
                <p className="text-white drop-shadow leading-relaxed">
                  Discover stories and navigate through different narrative
                  branches created by the community.
                </p>
              </div>
              <div className="text-center p-8 bg-black/30 rounded-xl backdrop-blur-sm border border-white/20">
                <h3 className="text-2xl font-semibold mb-4 text-white drop-shadow">
                  Write & Branch
                </h3>
                <p className="text-white drop-shadow leading-relaxed">
                  Create new branches at any point in a story, taking the
                  narrative in exciting new directions.
                </p>
              </div>
              <div className="text-center p-8 bg-black/30 rounded-xl backdrop-blur-sm border border-white/20">
                <h3 className="text-2xl font-semibold mb-4 text-white drop-shadow">
                  Vote & Shape
                </h3>
                <p className="text-white drop-shadow leading-relaxed">
                  Vote on your favorite branches to help guide which paths
                  become most popular.
                </p>
              </div>
            </div>
          </div>
        </div>
      </ParallaxGap>
    </div>
  );
}
