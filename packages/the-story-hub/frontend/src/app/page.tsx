"use client";

import { Button } from "@nextui-org/react";
import Link from "next/link";
import Image from "next/image";
import { StoriesGrid } from "@/components/stories/StoriesGrid";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { useFeaturedStories, useTrendingStories } from "@/hooks/useStories";
import { GenreSection } from "@/components/home/GenreSection";
import { getHomePageGenres } from "@/constants/genres";

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

  // Get 6 genres to display on homepage
  const homePageGenres = getHomePageGenres();

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
              <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto leading-relaxed">
                Help us keep The Story Hub free and accessible for everyone.
                Your support enables us to maintain the platform, add new
                features, and foster a thriving community of storytellers.
              </p>
              <div className="flex flex-col gap-6 items-center">
                {/* Patreon Button */}
                <a
                  href="https://patreon.com/thestoryhub"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group transition-all hover:scale-105"
                  aria-label="Support on Patreon"
                >
                  <div className="flex items-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg group-hover:shadow-xl transition-all">
                    <svg
                      className="w-6 h-6 text-white"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M15.386.524c-4.764 0-8.64 3.876-8.64 8.64 0 4.75 3.876 8.613 8.64 8.613 4.75 0 8.614-3.864 8.614-8.613C24 4.4 20.136.524 15.386.524M.003 23.537h4.22V.524H.003" />
                    </svg>
                    <span className="text-lg font-semibold text-white">
                      Become a Patron
                    </span>
                  </div>
                </a>
                {/* Learn More Link */}
                <a
                  href="/support"
                  className="text-gray-600 hover:text-purple-600 font-medium hover:underline transition-colors"
                >
                  View all benefits and tiers →
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

      {/* Dynamic Genre Sections - Alternating between dark sections and parallax gaps */}
      {homePageGenres.map((genre, index) => {
        // Alternate between ParallaxSection (dark) and GenreSection (which uses ParallaxSection internally)
        // For visual variety, we'll just use GenreSection with alternating backgrounds
        const backgrounds = [
          "#1a1a1a",
          "#2a2a2a",
          "#1a1a1a",
          "#252525",
          "#1a1a1a",
          "#222222",
        ];
        return (
          <GenreSection
            key={genre}
            genre={genre}
            background={backgrounds[index % backgrounds.length]}
            limit={8}
          />
        );
      })}

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
