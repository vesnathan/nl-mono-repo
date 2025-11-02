"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Select, SelectItem } from "@nextui-org/react";
import {
  listCommentsAPI,
  createCommentAPI,
  updateCommentAPI,
  deleteCommentAPI,
  voteOnCommentAPI,
} from "@/lib/api/comments";
import { CommentThread } from "./CommentThread";
import { CommentForm } from "./CommentForm";

interface CommentSectionProps {
  storyId: string;
  nodeId: string;
  currentUserId?: string;
}

export function CommentSection({
  storyId,
  nodeId,
  currentUserId,
}: CommentSectionProps) {
  const [sortBy, setSortBy] = useState<
    "NEWEST" | "OLDEST" | "MOST_UPVOTED" | "MOST_REPLIES"
  >("NEWEST");
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [allComments, setAllComments] = useState<any[]>([]);
  const [nextToken, setNextToken] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch top-level comments
  const {
    data: commentsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["comments", storyId, nodeId, sortBy, nextToken],
    queryFn: () =>
      listCommentsAPI(storyId, nodeId, sortBy, 20, nextToken || undefined),
    retry: 1, // Only retry once
    retryDelay: 1000,
  });

  // Update allComments when new data arrives
  useEffect(() => {
    console.log("===== COMMENTS DATA UPDATE =====");
    console.log("commentsData:", JSON.stringify(commentsData, null, 2));
    console.log("nextToken:", nextToken);
    console.log("allComments.length:", allComments.length);
    console.log("commentsData?.items?.length:", commentsData?.items?.length);
    console.log("commentsData?.total:", commentsData?.total);
    console.log("commentsData?.nextToken:", commentsData?.nextToken);

    if (commentsData?.items) {
      console.log("Processing comments data...");

      // Log each comment and its replies
      commentsData.items.forEach((comment, idx) => {
        console.log(`Comment ${idx}:`, {
          commentId: comment.commentId,
          content: comment.content?.substring(0, 50),
          replyCount: comment.stats?.replyCount,
          repliesLength: comment.replies?.length,
          hasReplies: !!comment.replies,
        });

        if (comment.replies) {
          comment.replies.forEach((reply, replyIdx) => {
            console.log(`  Reply ${replyIdx}:`, {
              commentId: reply.commentId,
              content: reply.content?.substring(0, 50),
              depth: reply.depth,
              nestedRepliesLength: reply.replies?.length,
            });
          });
        }
      });

      if (nextToken && allComments.length > 0) {
        console.log("APPENDING new comments to existing list");
        setAllComments((prev) => [...prev, ...commentsData.items]);
      } else {
        console.log("REPLACING all comments with new data");
        setAllComments(commentsData.items);
      }
    } else {
      console.log("No commentsData.items to process");
    }
    console.log("================================\n");
  }, [commentsData]);

  // Reset when sort changes
  const handleSortChange = (newSort: typeof sortBy) => {
    setSortBy(newSort);
    setNextToken(null);
    setAllComments([]);
  };

  // Load more comments
  const loadMoreComments = () => {
    if (commentsData?.nextToken) {
      setNextToken(commentsData.nextToken);
    }
  };

  // Create comment mutation
  const createCommentMutation = useMutation({
    mutationFn: (input: { content: string; parentCommentId?: string }) =>
      createCommentAPI(storyId, nodeId, input.content, input.parentCommentId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["comments", storyId, nodeId],
      });
      setShowCommentForm(false);
    },
  });

  // Update comment mutation
  const updateCommentMutation = useMutation({
    mutationFn: ({
      commentId,
      content,
    }: {
      commentId: string;
      content: string;
    }) => updateCommentAPI(storyId, nodeId, commentId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["comments", storyId, nodeId],
      });
    },
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) =>
      deleteCommentAPI(storyId, nodeId, commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["comments", storyId, nodeId],
      });
    },
  });

  // Vote mutation
  const voteMutation = useMutation({
    mutationFn: ({
      commentId,
      voteType,
    }: {
      commentId: string;
      voteType: "UPVOTE" | "DOWNVOTE";
    }) => voteOnCommentAPI(storyId, nodeId, commentId, voteType),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["comments", storyId, nodeId],
      });
    },
  });

  const handleCreateComment = async (content: string) => {
    await createCommentMutation.mutateAsync({ content });
  };

  const handleReply = async (parentCommentId: string, content: string) => {
    await createCommentMutation.mutateAsync({ content, parentCommentId });
  };

  const handleEdit = async (commentId: string, content: string) => {
    await updateCommentMutation.mutateAsync({ commentId, content });
  };

  const handleDelete = async (commentId: string) => {
    await deleteCommentMutation.mutateAsync(commentId);
  };

  const handleVote = async (
    commentId: string,
    voteType: "UPVOTE" | "DOWNVOTE",
  ) => {
    await voteMutation.mutateAsync({ commentId, voteType });
  };

  // Show loading state (only on initial load)
  if (isLoading && allComments.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-700 p-6 rounded-lg">
        <div className="text-center text-gray-400">Loading discussion...</div>
      </div>
    );
  }

  // Use allComments for display
  const comments = allComments;
  const hasError = !!error;
  const hasMore = !!commentsData?.nextToken;

  console.log("===== RENDER STATE =====");
  console.log("Rendering with comments.length:", comments.length);
  console.log("hasError:", hasError);
  console.log("hasMore:", hasMore);
  console.log("isLoading:", isLoading);
  console.log("Total from API:", commentsData?.total);
  console.log("========================\n");

  return (
    <div className="bg-gray-900 border border-gray-700 p-6 rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-white">
          Discussion ({commentsData?.total || 0})
        </h3>
        <div className="flex items-center gap-3">
          <Select
            label="Sort by"
            size="sm"
            className="w-48"
            selectedKeys={[sortBy]}
            onChange={(e) =>
              handleSortChange(
                e.target.value as
                  | "NEWEST"
                  | "OLDEST"
                  | "MOST_UPVOTED"
                  | "MOST_REPLIES",
              )
            }
            classNames={{
              trigger: "bg-gray-800 border-gray-700",
              value: "text-white",
              label: "text-white",
              popoverContent: "bg-gray-800",
              listbox: "bg-gray-800",
            }}
          >
            <SelectItem key="NEWEST" value="NEWEST" className="text-white">
              Newest
            </SelectItem>
            <SelectItem key="OLDEST" value="OLDEST" className="text-white">
              Oldest
            </SelectItem>
            <SelectItem
              key="MOST_UPVOTED"
              value="MOST_UPVOTED"
              className="text-white"
            >
              Most Upvoted
            </SelectItem>
            <SelectItem
              key="MOST_REPLIES"
              value="MOST_REPLIES"
              className="text-white"
            >
              Most Replies
            </SelectItem>
          </Select>
          {currentUserId && (
            <Button
              color="primary"
              size="sm"
              onClick={() => setShowCommentForm(!showCommentForm)}
            >
              {showCommentForm ? "Cancel" : "Add Comment"}
            </Button>
          )}
        </div>
      </div>

      {/* New Comment Form */}
      {showCommentForm && currentUserId && (
        <div className="mb-6">
          <CommentForm
            onSubmit={handleCreateComment}
            onCancel={() => setShowCommentForm(false)}
          />
        </div>
      )}

      {/* Login prompt */}
      {!currentUserId && (
        <div className="mb-6 p-4 bg-gray-800 border border-gray-700 rounded text-center">
          <p className="text-gray-400">Please log in to join the discussion</p>
        </div>
      )}

      {/* Error message if comments failed to load */}
      {hasError && (
        <div className="mb-4 p-4 bg-red-900/20 border border-red-700 rounded text-red-400 text-center">
          Unable to load comments. Please try refreshing the page.
        </div>
      )}

      {/* Comments List */}
      {comments.length === 0 && !hasError ? (
        <div className="text-center py-8 text-gray-400">
          No comments yet. Be the first to share your thoughts!
        </div>
      ) : !hasError ? (
        <>
          <div className="space-y-4">
            {comments.map((comment) => (
              <CommentThread
                key={comment.commentId}
                comment={comment}
                storyId={storyId}
                nodeId={nodeId}
                onReply={handleReply}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onVote={handleVote}
                currentUserId={currentUserId}
              />
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="mt-6 text-center">
              <Button
                color="primary"
                variant="flat"
                onClick={loadMoreComments}
                isLoading={isLoading}
                disabled={isLoading}
              >
                {isLoading ? "Loading..." : "Load Previous Comments"}
              </Button>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
