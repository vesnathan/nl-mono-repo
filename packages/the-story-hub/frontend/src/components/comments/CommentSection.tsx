"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@nextui-org/react";
import {
  listCommentsAPI,
  createCommentAPI,
  updateCommentAPI,
  deleteCommentAPI,
  voteOnCommentAPI,
} from "@/lib/api/comments";
import { CommentThread } from "./CommentThread";
import { CommentForm } from "./CommentForm";
import type { Comment } from "@/types/CommentSchemas";

interface CommentSectionProps {
  storyId: string;
  nodeId: string;
  currentUserId?: string;
  storyAuthorId?: string;
}

export function CommentSection({
  storyId,
  nodeId,
  currentUserId,
  storyAuthorId,
}: CommentSectionProps) {
  const [sortBy, setSortBy] = useState<
    "NEWEST" | "OLDEST" | "MOST_UPVOTED" | "MOST_REPLIES"
  >("NEWEST");
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [allComments, setAllComments] = useState<Comment[]>([]);
  const [nextToken, setNextToken] = useState<string | null>(null);
  const [totalAvailable, setTotalAvailable] = useState<number>(0);
  const queryClient = useQueryClient();

  // Fetch top-level comments
  const {
    data: commentsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["comments", storyId, nodeId, sortBy, nextToken],
    queryFn: () =>
      listCommentsAPI(storyId, nodeId, sortBy, 20, nextToken || undefined),
    retry: 1, // Only retry once
    retryDelay: 1000,
  });

  // Update allComments when new data arrives
  useEffect(() => {

    if (commentsData?.items) {

      // Log each comment and its replies
      commentsData.items.forEach((comment, idx) => {
          commentId: comment.commentId,
          content: comment.content?.substring(0, 50),
          replyCount: comment.stats?.replyCount,
          repliesLength: comment.replies?.length,
          hasReplies: !!comment.replies,
        });

        if (comment.replies) {
          comment.replies.forEach((reply, replyIdx) => {
              commentId: reply.commentId,
              content: reply.content?.substring(0, 50),
              depth: reply.depth,
              nestedRepliesLength: reply.replies?.length,
            });
          });
        }
      });

      if (nextToken && allComments.length > 0) {
        setAllComments((prev) => [...commentsData.items, ...prev]);
      } else {
        setAllComments(commentsData.items);
      }

      // Update total available count
      if (commentsData.total !== undefined) {
        setTotalAvailable(commentsData.total);
      }
    } else {
    }
  }, [commentsData]);

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
  const hasPreviousComments = allComments.length < totalAvailable;

  // Count total replies recursively
  const countReplies = (comment: Comment): number => {
    let count = 0;
    if (comment.replies && comment.replies.length > 0) {
      count += comment.replies.length;
      comment.replies.forEach((reply: Comment) => {
        count += countReplies(reply);
      });
    }
    return count;
  };

  const totalReplies = comments.reduce(
    (sum, comment) => sum + countReplies(comment),
    0,
  );


  return (
    <div className="bg-gray-900 border border-gray-700 p-6 rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-white">
          Discussion ({commentsData?.total || 0})
        </h3>
        <div className="flex items-center gap-3">
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
          {/* Load Previous Comments Button - Top */}
          {hasPreviousComments && hasMore && (
            <div className="mb-4 text-center">
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

          {/* Showing comments text */}
          <div className="mb-4 text-center text-sm text-gray-400">
            Showing {comments.length} of {totalAvailable} comment
            {totalAvailable === 1 ? "" : "s"}
            {totalReplies > 0 &&
              ` (${totalReplies} ${totalReplies === 1 ? "reply" : "replies"})`}
          </div>

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
                storyAuthorId={storyAuthorId}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
