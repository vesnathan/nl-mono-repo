"use client";

import { useState } from "react";
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
  const queryClient = useQueryClient();

  // Fetch top-level comments
  const {
    data: commentsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["comments", storyId, nodeId, sortBy],
    queryFn: () => listCommentsAPI(storyId, nodeId, sortBy),
    retry: 1, // Only retry once
    retryDelay: 1000,
  });

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

  // Show loading state
  if (isLoading) {
    return (
      <div className="bg-gray-900 border border-gray-700 p-6 rounded-lg">
        <div className="text-center text-gray-400">Loading discussion...</div>
      </div>
    );
  }

  // Show empty state even on error so users know comments exist
  const comments = commentsData?.items || [];
  const hasError = !!error;

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
              setSortBy(
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
            }}
          >
            <SelectItem key="NEWEST" value="NEWEST">
              Newest
            </SelectItem>
            <SelectItem key="OLDEST" value="OLDEST">
              Oldest
            </SelectItem>
            <SelectItem key="MOST_UPVOTED" value="MOST_UPVOTED">
              Most Upvoted
            </SelectItem>
            <SelectItem key="MOST_REPLIES" value="MOST_REPLIES">
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
      ) : null}
    </div>
  );
}
