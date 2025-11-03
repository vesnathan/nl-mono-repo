"use client";

import { useParams } from "next/navigation";
import { useStory } from "@/hooks/useStory";
import { useQuery } from "@tanstack/react-query";
import { getChapterAPI, listBranchesAPI } from "@/lib/api/chapters";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import Link from "next/link";
import {
  Button,
  Chip,
  Accordion,
  AccordionItem,
  Tooltip,
} from "@nextui-org/react";
import { useState } from "react";
import { StoryMetadataChips } from "@/components/stories/StoryMetadataChips";
import { CommentSection } from "@/components/comments/CommentSection";
import { useAuth } from "@/hooks/useAuth";
import { AuthRequiredButton } from "@/components/auth/AuthRequiredButton";
import { listCommentsAPI } from "@/lib/api/comments";
import { PatreonBadge } from "@/components/common/PatreonBadge";
import { OGBadge } from "@/components/common/OGBadge";

// Component to display branch comment count
function BranchCommentButton({
  storyId,
  nodeId,
  isExpanded,
  onClick,
}: {
  storyId: string;
  nodeId: string;
  isExpanded: boolean;
  onClick: (e: React.MouseEvent) => void;
}) {
  const { data: commentData } = useQuery({
    queryKey: ["comments", storyId, nodeId, "NEWEST"],
    queryFn: () => listCommentsAPI(storyId, nodeId, "NEWEST", 1),
    enabled: !!nodeId,
  });

  return (
    <button
      type="button"
      onClick={onClick}
      className={`hover:text-white transition-colors ${isExpanded ? "text-white font-semibold" : ""}`}
      title="View discussion"
    >
      💬 Discussion ({commentData?.total || 0}) {isExpanded ? "▲" : "▼"}
    </button>
  );
}

interface StoryData {
  ageRating?: string;
  [key: string]: unknown;
}

// Recursive component to render a chapter and its branches
function ChapterSection({
  storyId,
  nodeId,
  story,
  isRoot = false,
  currentUserId,
  storyAuthorId,
}: {
  storyId: string;
  nodeId: string;
  story: StoryData;
  isRoot?: boolean;
  currentUserId?: string;
  storyAuthorId?: string;
}) {
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [isAccordionOpen, setIsAccordionOpen] = useState(true);
  const [shouldFetchBranches, setShouldFetchBranches] = useState(isRoot); // Only fetch for root initially
  const [expandedBranchComments, setExpandedBranchComments] = useState<
    string | null
  >(null); // Track which branch's comments are expanded
  const [showMainComments, setShowMainComments] = useState(false); // Track if main chapter comments are expanded

  // Fetch the chapter content
  const { data: chapter, isLoading: chapterLoading } = useQuery({
    queryKey: ["chapter", storyId, nodeId],
    queryFn: () => getChapterAPI(storyId, nodeId),
    enabled: !!nodeId,
  });

  // Fetch branches for this chapter - only when accordion is opened
  const { data: branches } = useQuery({
    queryKey: ["branches", storyId, nodeId],
    queryFn: () => listBranchesAPI(storyId, nodeId),
    enabled: !!nodeId && shouldFetchBranches,
  });

  // Fetch comment count for main chapter
  const { data: mainCommentData } = useQuery({
    queryKey: ["comments", storyId, nodeId, "NEWEST"],
    queryFn: () => listCommentsAPI(storyId, nodeId, "NEWEST", 1),
    enabled: !!nodeId,
  });

  // Determine community favourite
  const communityFavouriteId =
    branches && branches.length > 0
      ? branches.reduce((max, branch) =>
          (branch.stats?.upvotes || 0) > (max.stats?.upvotes || 0)
            ? branch
            : max,
        ).nodeId
      : null;

  // Sort branches to put OP Approved first
  const sortedBranches = branches
    ? [...branches].sort((a, b) => {
        if (a.badges?.authorApproved && !b.badges?.authorApproved) return -1;
        if (!a.badges?.authorApproved && b.badges?.authorApproved) return 1;
        return 0;
      })
    : [];

  const handleBranchSelect = (branchId: string) => {
    setSelectedBranchId(branchId);
    setIsAccordionOpen(false);
    // Scroll to the new chapter after accordion closes and content renders
    setTimeout(() => {
      const element = document.getElementById(`chapter-${branchId}`);
      if (element) {
        const elementPosition =
          element.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = elementPosition - 50; // Offset for navbar
        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        });
      }
    }, 300);
  };

  if (chapterLoading) {
    return <LoadingSpinner label="Loading chapter..." />;
  }

  return (
    <>
      {/* Chapter content */}
      {chapter && (
        <div
          id={`chapter-${nodeId}`}
          className="bg-gray-900 border border-gray-700 p-8 mb-6"
        >
          <div className="prose prose-invert prose-lg max-w-none">
            <div className="text-gray-100 whitespace-pre-wrap leading-relaxed">
              {chapter.content}
            </div>
          </div>

          {/* Expandable comment section for main chapter */}
          <div className="mt-6 pt-6 border-t border-gray-700">
            <button
              type="button"
              onClick={() => setShowMainComments(!showMainComments)}
              className={`text-lg font-semibold hover:text-white transition-colors ${showMainComments ? "text-white" : "text-gray-400"}`}
            >
              💬 Discussion ({mainCommentData?.total || 0}){" "}
              {showMainComments ? "▲" : "▼"}
            </button>

            {showMainComments && (
              <div className="mt-4">
                <CommentSection
                  storyId={storyId}
                  nodeId={nodeId}
                  currentUserId={currentUserId}
                  storyAuthorId={storyAuthorId}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Branch options in accordion OR Continue Story button */}
      {sortedBranches && sortedBranches.length > 0 ? (
        sortedBranches.length === 1 ? (
          // Auto-display single branch without accordion
          <div className="bg-gray-900 border border-gray-700 mb-6 p-8">
            <h2 className="text-2xl font-bold text-white mb-4">
              Continue Reading
            </h2>
            <div className="space-y-3 pb-4">
              {sortedBranches.map((branch) => (
                <div
                  key={branch.nodeId}
                  onClick={() => handleBranchSelect(branch.nodeId)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleBranchSelect(branch.nodeId);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  className="bg-gray-800 border border-gray-700 p-4 hover:bg-gray-750 transition-colors cursor-pointer relative"
                >
                  {/* AI Badge - Top Right */}
                  {branch.aiCreated && (
                    <div className="absolute top-2 right-2">
                      <Tooltip content="This branch was created with AI assistance">
                        <span className="px-2 py-1 text-xs bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded font-semibold">
                          🤖 AI
                        </span>
                      </Tooltip>
                    </div>
                  )}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-white">
                      {branch.branchDescription ||
                        `Chapter ${branch.chapterNumber}`}
                    </h3>
                    <div className="flex gap-2 flex-shrink-0">
                      {branch.nodeId === communityFavouriteId &&
                        (branch.stats?.upvotes || 0) > 0 && (
                          <span
                            className="px-2 py-1 text-xs bg-green-600 text-white rounded whitespace-nowrap"
                            title="Most upvoted by the community"
                          >
                            ♥ Community Favourite
                          </span>
                        )}
                      {branch.badges?.authorApproved && (
                        <span
                          className="px-2 py-1 text-xs bg-purple-600 text-white rounded whitespace-nowrap"
                          title="Approved by original poster"
                        >
                          ✓ OP Approved
                        </span>
                      )}
                    </div>
                  </div>
                  {branch.content && (
                    <p className="text-gray-300 text-sm mb-3 line-clamp-2">
                      {branch.content.substring(0, 150)}...
                    </p>
                  )}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <div className="flex items-center gap-1">
                        <span>👤 by {branch.authorName}</span>
                        {branch.authorOGSupporter && <OGBadge size="sm" />}
                        {branch.authorPatreonSupporter && (
                          <PatreonBadge size="sm" />
                        )}
                      </div>
                      <span>👍 {branch.stats?.upvotes || 0}</span>
                      <span>👎 {branch.stats?.downvotes || 0}</span>
                      <span>🌿 {branch.stats?.childBranches || 0}</span>
                      <BranchCommentButton
                        storyId={storyId}
                        nodeId={branch.nodeId}
                        isExpanded={expandedBranchComments === branch.nodeId}
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedBranchComments(
                            expandedBranchComments === branch.nodeId
                              ? null
                              : branch.nodeId,
                          );
                        }}
                      />
                    </div>
                  </div>

                  {/* Branch Comments Section */}
                  {expandedBranchComments === branch.nodeId && (
                    <div
                      className="mt-4 pt-4 border-t border-gray-700"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.stopPropagation();
                        }
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      <CommentSection
                        storyId={storyId}
                        nodeId={branch.nodeId}
                        currentUserId={currentUserId}
                        storyAuthorId={storyAuthorId}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Add Branch Button for single branch view */}
            <div className="border-t border-gray-700 pt-4">
              <AuthRequiredButton
                color="secondary"
                variant="flat"
                className="w-full"
                actionDescription="add a new branch to this story"
                onPress={() => {
                  // TODO: Navigate to branch creation page
                }}
              >
                + Add Your Own Branch
              </AuthRequiredButton>
            </div>
          </div>
        ) : (
          // Multiple branches - show in accordion
          <div className="bg-gray-900 border border-gray-700 mb-6">
            <Accordion
              selectedKeys={isAccordionOpen ? ["branches"] : []}
              onSelectionChange={(keys) => {
                const keysArray = Array.from(keys);
                const isOpening = keysArray.includes("branches");
                setIsAccordionOpen(isOpening);
                // Trigger branch fetching when accordion opens
                if (isOpening && !shouldFetchBranches) {
                  setShouldFetchBranches(true);
                }
              }}
            >
              <AccordionItem
                key="branches"
                title={
                  <h2 className="text-2xl font-bold text-white">
                    Choose Your Path
                  </h2>
                }
                className="px-8"
              >
                <div className="space-y-3 pb-4">
                  {sortedBranches.map((branch) => (
                    <div
                      key={branch.nodeId}
                      onClick={() => handleBranchSelect(branch.nodeId)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleBranchSelect(branch.nodeId);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      className="bg-gray-800 border border-gray-700 p-4 hover:bg-gray-750 transition-colors cursor-pointer relative"
                    >
                      {/* AI Badge - Top Right */}
                      {branch.aiCreated && (
                        <div className="absolute top-2 right-2">
                          <Tooltip content="This branch was created with AI assistance">
                            <span className="px-2 py-1 text-xs bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded font-semibold">
                              🤖 AI
                            </span>
                          </Tooltip>
                        </div>
                      )}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-white">
                          {branch.branchDescription ||
                            `Chapter ${branch.chapterNumber}`}
                        </h3>
                        <div className="flex gap-2 flex-shrink-0">
                          {branch.nodeId === communityFavouriteId &&
                            (branch.stats?.upvotes || 0) > 0 && (
                              <span
                                className="px-2 py-1 text-xs bg-green-600 text-white rounded whitespace-nowrap"
                                title="Most upvoted by the community"
                              >
                                ♥ Community Favourite
                              </span>
                            )}
                          {branch.badges?.authorApproved && (
                            <span
                              className="px-2 py-1 text-xs bg-purple-600 text-white rounded whitespace-nowrap"
                              title="Approved by original poster"
                            >
                              ✓ OP Approved
                            </span>
                          )}
                        </div>
                      </div>
                      {branch.content && (
                        <p className="text-gray-300 text-sm mb-3 line-clamp-2">
                          {branch.content.substring(0, 150)}...
                        </p>
                      )}
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <div className="flex items-center gap-1">
                            <span>👤 by {branch.authorName}</span>
                            {branch.authorOGSupporter && <OGBadge size="sm" />}
                            {branch.authorPatreonSupporter && (
                              <PatreonBadge size="sm" />
                            )}
                          </div>
                          <span>👍 {branch.stats?.upvotes || 0}</span>
                          <span>👎 {branch.stats?.downvotes || 0}</span>
                          <span>🌿 {branch.stats?.childBranches || 0}</span>
                          <BranchCommentButton
                            storyId={storyId}
                            nodeId={branch.nodeId}
                            isExpanded={
                              expandedBranchComments === branch.nodeId
                            }
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedBranchComments(
                                expandedBranchComments === branch.nodeId
                                  ? null
                                  : branch.nodeId,
                              );
                            }}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          {(branch.ageRating || story.ageRating) && (
                            <Chip
                              size="sm"
                              variant="flat"
                              className="bg-[#F28C28] text-white px-3"
                            >
                              {(branch.ageRating || story.ageRating) ===
                              "ADULT_18_PLUS"
                                ? "18+"
                                : String(
                                    branch.ageRating || story.ageRating,
                                  ).replace(/_/g, "-")}
                            </Chip>
                          )}
                          {branch.maxChildAgeRating &&
                            branch.maxChildAgeRating !==
                              (branch.ageRating || story.ageRating) && (
                              <Chip
                                size="sm"
                                variant="flat"
                                className="bg-red-600 text-white"
                                title="Contains child branches with higher age rating"
                              >
                                ⚠️ Contains{" "}
                                {branch.maxChildAgeRating.replace(/_/g, "-")}{" "}
                                content
                              </Chip>
                            )}
                          {branch.contentWarnings &&
                            branch.contentWarnings.length > 0 && (
                              <Chip
                                size="sm"
                                variant="flat"
                                color="warning"
                                title={branch.contentWarnings.join(", ")}
                              >
                                ⚠️ Warnings
                              </Chip>
                            )}
                        </div>
                      </div>

                      {/* Expanded comments section for this branch */}
                      {expandedBranchComments === branch.nodeId && (
                        <div
                          className="mt-4 pt-4 border-t border-gray-700"
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.stopPropagation();
                            }
                          }}
                          role="presentation"
                        >
                          <CommentSection
                            storyId={storyId}
                            nodeId={branch.nodeId}
                            currentUserId={currentUserId}
                            storyAuthorId={storyAuthorId}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add Branch Button */}
                <div className="pt-4 pb-2 border-t border-gray-700">
                  <AuthRequiredButton
                    color="secondary"
                    variant="flat"
                    className="w-full"
                    actionDescription="add a new branch to this story"
                    onPress={() => {
                      // TODO: Navigate to branch creation page
                    }}
                  >
                    + Add Your Own Branch
                  </AuthRequiredButton>
                </div>
              </AccordionItem>
            </Accordion>
          </div>
        )
      ) : (
        <div className="bg-gray-900 border border-gray-700 p-8 mb-6 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            End of This Path
          </h2>
          <p className="text-gray-400 mb-6">
            This story branch hasn't been continued yet. Be the first to write
            what happens next!
          </p>
          <AuthRequiredButton
            color="primary"
            size="lg"
            className="bg-brand-purple"
            actionDescription="continue this story"
            onPress={() => {
              // TODO: Navigate to branch creation page
            }}
          >
            Continue the Story
          </AuthRequiredButton>
        </div>
      )}

      {/* Recursively render the selected branch */}
      {selectedBranchId && (
        <ChapterSection
          storyId={storyId}
          nodeId={selectedBranchId}
          story={story}
          currentUserId={currentUserId}
          storyAuthorId={storyAuthorId}
        />
      )}
    </>
  );
}

export default function StoryDetailPage() {
  const params = useParams();
  const storyId = (params?.storyId as string) || "";
  const { userId } = useAuth();

  const {
    data: story,
    isLoading: storyLoading,
    error: storyError,
    refetch,
  } = useStory(storyId);

  const isLoading = storyLoading;
  const error = storyError;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <LoadingSpinner label="Loading story..." />
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="max-w-2xl mx-auto px-4">
          <ErrorMessage message="Failed to load story" retry={refetch} />
          <div className="text-center mt-6">
            <Link href="/browse">
              <Button className="bg-brand-purple text-white">
                Back to Browse
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Back button */}
          <div className="mb-6">
            <Link href="/browse">
              <Button variant="bordered" className="text-white border-white">
                ← Back to Browse
              </Button>
            </Link>
          </div>

          {/* Story header */}
          <div className="bg-gray-900 border border-gray-700 p-8 mb-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Cover Image */}
              {story.coverImageUrl && (
                <div className="w-full md:w-48 h-72 flex-shrink-0">
                  <img
                    src={story.coverImageUrl}
                    alt={story.title}
                    className="w-full h-full object-cover rounded"
                  />
                </div>
              )}

              {/* Story Info */}
              <div className="flex-1">
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                  {story.title}
                </h1>

                <div className="flex items-center gap-2 text-lg text-gray-400 mb-4">
                  <span>by {story.authorName}</span>
                  {story.authorOGSupporter && <OGBadge size="sm" />}
                  {story.authorPatreonSupporter && <PatreonBadge size="sm" />}
                </div>

                {/* Story metadata */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <StoryMetadataChips
                    aiCreated={story.aiCreated}
                    featured={story.featured}
                    genres={story.genre}
                    ageRating={story.ageRating}
                  />
                </div>

                {/* Story stats */}
                <div className="flex gap-4 text-sm text-gray-400">
                  <span>📖 {story.stats.totalReads} reads</span>
                  <span>🌿 {story.stats.totalBranches} branches</span>
                  <span>💬 {story.stats.totalComments} comments</span>
                  {story.stats.rating && (
                    <span>⭐ {story.stats.rating.toFixed(1)}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Synopsis */}
            {story.synopsis && (
              <div className="mt-4 pt-4 border-t border-gray-700">
                <p className="text-gray-300 leading-relaxed">
                  {story.synopsis}
                </p>
              </div>
            )}

            {/* Content warnings if any */}
            {story.contentWarnings && story.contentWarnings.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-700">
                <p className="text-sm text-yellow-500 font-semibold mb-2">
                  ⚠️ Content Warnings:
                </p>
                <div className="flex flex-wrap gap-2">
                  {story.contentWarnings.map((warning) => (
                    <Chip
                      key={warning}
                      size="sm"
                      variant="flat"
                      color="warning"
                    >
                      {warning}
                    </Chip>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Recursive chapter rendering starting from root */}
          {story.rootNodeId ? (
            <ChapterSection
              storyId={storyId}
              nodeId={story.rootNodeId}
              story={story}
              isRoot
              currentUserId={userId}
              storyAuthorId={story.authorId}
            />
          ) : (
            <div className="bg-gray-900 border border-gray-700 p-8 mb-6">
              <p className="text-gray-400">
                This story doesn't have any chapters yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
