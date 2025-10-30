'use client';

import { Card, CardBody, CardFooter, CardHeader, Chip, Button } from '@nextui-org/react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import type { Story } from '@/types/gqlTypes';

interface StoryCardProps {
  story: Story;
  index?: number;
}

export function StoryCard({ story, index = 0 }: StoryCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="h-full hover:shadow-lg transition-shadow">
        <CardHeader className="flex-col items-start gap-2 pb-0">
          {story.coverImageUrl && (
            <img
              src={story.coverImageUrl}
              alt={story.title}
              className="w-full h-48 object-cover rounded-t-lg"
            />
          )}
          <div className="w-full">
            <h3 className="text-xl font-bold line-clamp-2">{story.title}</h3>
            <p className="text-sm text-default-500">by {story.authorId}</p>
          </div>
        </CardHeader>
        
        <CardBody className="gap-2">
          <p className="text-sm text-default-600 line-clamp-3">
            {story.synopsis}
          </p>
          
          <div className="flex flex-wrap gap-1">
            {story.genre.slice(0, 3).map((genre) => (
              <Chip key={genre} size="sm" variant="flat" color="primary">
                {genre}
              </Chip>
            ))}
            <Chip size="sm" variant="flat" color="warning">
              {story.ageRating}
            </Chip>
          </div>

          <div className="flex gap-4 text-xs text-default-500 mt-2">
            <span>📖 {story.stats.totalReads} reads</span>
            <span>🌿 {story.stats.totalBranches} branches</span>
            {story.stats.rating && <span>⭐ {story.stats.rating.toFixed(1)}</span>}
          </div>
        </CardBody>

        <CardFooter>
          <Link href={`/story/${story.storyId}`} className="w-full">
            <Button color="primary" className="w-full">
              Read Story
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
