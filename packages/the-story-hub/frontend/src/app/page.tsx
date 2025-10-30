'use client';

import { Button } from '@nextui-org/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { StoriesGrid } from '@/components/stories/StoriesGrid';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { AuthRequiredButton } from '@/components/auth/AuthRequiredButton';
import { useFeaturedStories, useTrendingStories } from '@/hooks/useStories';

export default function HomePage() {
  const router = useRouter();
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
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-6xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent mb-4">
          Welcome to The Story Hub
        </h1>
        <p className="text-xl text-default-600 max-w-2xl mx-auto mb-8">
          Where stories branch into infinite possibilities. Read, write, and shape
          collaborative narratives with readers around the world.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/browse">
            <Button color="primary" size="lg" className="font-semibold">
              Browse Stories
            </Button>
          </Link>
          <AuthRequiredButton
            color="secondary"
            size="lg"
            variant="bordered"
            className="font-semibold"
            actionDescription="create a story"
            onPress={() => router.push('/story/create')}
          >
            Start Writing
          </AuthRequiredButton>
        </div>
      </section>

      {/* Featured Stories Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-default-900">Featured Stories</h2>
          <Link href="/browse?filter=featured">
            <Button variant="light" color="primary">
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
      </section>

      {/* Trending Stories Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-default-900">Trending Now</h2>
          <Link href="/browse">
            <Button variant="light" color="primary">
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
      </section>

      {/* How It Works Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center p-6">
            <div className="text-5xl mb-4">📖</div>
            <h3 className="text-xl font-semibold mb-2">Read & Explore</h3>
            <p className="text-default-600">
              Discover stories and navigate through different narrative branches
              created by the community.
            </p>
          </div>
          <div className="text-center p-6">
            <div className="text-5xl mb-4">✍️</div>
            <h3 className="text-xl font-semibold mb-2">Write & Branch</h3>
            <p className="text-default-600">
              Create new branches at any point in a story, taking the narrative in
              exciting new directions.
            </p>
          </div>
          <div className="text-center p-6">
            <div className="text-5xl mb-4">⭐</div>
            <h3 className="text-xl font-semibold mb-2">Vote & Shape</h3>
            <p className="text-default-600">
              Vote on your favorite branches to help guide which paths become most
              popular.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
