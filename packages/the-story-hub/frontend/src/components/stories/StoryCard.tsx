"use client";

import {
  Card,
  Chip,
  Button,
  Tooltip,
  Modal,
  ModalContent,
  ModalBody,
  useDisclosure,
} from "@nextui-org/react";
import { motion } from "framer-motion";
import Link from "next/link";
import type { Story } from "@/types/gqlTypes";
import { PatreonBadge } from "@/components/common/PatreonBadge";
import { OGBadge } from "@/components/common/OGBadge";
import { StoryMetadataChips } from "./StoryMetadataChips";

interface StoryCardProps {
  story: Story;
  index?: number;
}

export function StoryCard({ story, index = 0 }: StoryCardProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="h-[200px]"
    >
      <Card className="hover:shadow-lg transition-shadow h-full rounded-none border border-gray-700 bg-gray-900">
        <div className="flex flex-row gap-4 p-4 h-full relative">
          {/* AI Badge - Top Right */}
          {story.aiCreated && (
            <div className="absolute top-2 right-2 z-10">
              <Tooltip content="This story was created with AI assistance">
                <Chip
                  size="sm"
                  variant="solid"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold"
                >
                  🤖 AI
                </Chip>
              </Tooltip>
            </div>
          )}

          {/* Cover Image - Left Side */}
          {story.coverImageUrl && (
            <div
              className="w-32 h-full flex-shrink-0 relative overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
              onClick={onOpen}
              title="Click to enlarge"
            >
              <img
                src={story.coverImageUrl}
                alt={story.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Content - Right Side */}
          <div className="flex flex-col flex-grow min-w-0 gap-2">
            {/* Title and Author */}
            <div>
              <h3 className="text-lg font-bold line-clamp-2 text-white">
                {story.title}
              </h3>
              <div className="flex items-center gap-1">
                <p className="text-xs text-gray-400">by {story.authorName}</p>
                {story.authorOGSupporter && <OGBadge size="sm" />}
                {story.authorPatreonSupporter && <PatreonBadge size="sm" />}
              </div>
            </div>

            {/* Synopsis */}
            <Tooltip
              content={story.synopsis}
              className="max-w-md"
              closeDelay={100}
            >
              <p className="text-sm text-gray-300 line-clamp-2 cursor-help">
                {story.synopsis}
              </p>
            </Tooltip>

            {/* Tags */}
            <div className="flex flex-wrap gap-1">
              <StoryMetadataChips
                aiCreated={story.aiCreated}
                featured={story.featured}
                genres={story.genre}
                ageRating={story.ageRating}
                maxGenres={2}
                showAIBadge={false}
                showFeatured={false}
              />
            </div>

            {/* Stats and Button */}
            <div className="flex items-center justify-between gap-2 mt-auto">
              <div className="flex gap-3 text-xs text-gray-400">
                <span>📖 {story.stats.totalReads}</span>
                <span>🌿 {story.stats.totalBranches}</span>
                <span>💬 {story.stats.totalComments}</span>
                {story.stats.rating && (
                  <span>⭐ {story.stats.rating.toFixed(1)}</span>
                )}
              </div>
              <Link href={`/story/${story.storyId}`}>
                <Button color="primary" size="sm">
                  Read
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Card>

      {/* Image Modal */}
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="3xl"
        classNames={{
          base: "bg-black/90",
          closeButton: "text-white hover:bg-white/20",
        }}
      >
        <ModalContent>
          <ModalBody className="p-0">
            {story.coverImageUrl && (
              <img
                src={story.coverImageUrl}
                alt={story.title}
                className="w-full h-auto max-h-[80vh] object-contain"
              />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </motion.div>
  );
}
