"use client";

import { useState } from "react";
import { Button, Avatar, Accordion, AccordionItem } from "@nextui-org/react";
import { Comment } from "@/types/CommentSchemas";
import { CommentForm } from "./CommentForm";
import { PatreonBadge } from "@/components/common/PatreonBadge";
import { OGBadge } from "@/components/common/OGBadge";

interface CommentThreadProps {
  comment: Comment;
  storyId: string;
  nodeId: string;
  depth?: number;
  onReply?: (commentId: string, content: string) => Promise<void>;
  onEdit?: (commentId: string, content: string) => Promise<void>;
  onDelete?: (commentId: string) => Promise<void>;
  onVote?: (
    commentId: string,
    voteType: "UPVOTE" | "DOWNVOTE",
  ) => Promise<void>;
  currentUserId?: string;
}

export function CommentThread({
  comment,
  storyId,
  nodeId,
  depth = 0,
  onReply,
  onEdit,
  onDelete,
  onVote,
  currentUserId,
}: CommentThreadProps) {
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

  const isAuthor = currentUserId === comment.authorId;
  const isDeleted = comment.content === "[deleted]";
  const hasReplies = (comment.replies?.length || 0) > 0;

  const handleReply = async (content: string) => {
    if (onReply) {
      await onReply(comment.commentId, content);
      setIsReplying(false);
      setShowReplies(true);
    }
  };

  const handleEdit = async () => {
    if (onEdit && editContent !== comment.content) {
      await onEdit(comment.commentId, editContent);
      setIsEditing(false);
    }
  };

  const handleDelete = async () => {
    if (onDelete && confirm("Are you sure you want to delete this comment?")) {
      await onDelete(comment.commentId);
    }
  };

  const handleVote = async (voteType: "UPVOTE" | "DOWNVOTE") => {
    if (onVote) {
      await onVote(comment.commentId, voteType);
    }
  };

  // Indent based on depth, but cap at a reasonable level
  const maxIndent = 4;
  const indentLevel = Math.min(depth, maxIndent);
  const marginLeft = indentLevel * 24; // 24px per level

  return (
    <div className="mb-4" style={{ marginLeft: `${marginLeft}px` }}>
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
        {/* Comment Header */}
        <div className="flex items-start gap-3 mb-3">
          <Avatar
            name={comment.authorName}
            size="sm"
            className="flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-white">
                {comment.authorName}
              </span>
              {comment.authorOGSupporter && <OGBadge size="sm" />}
              {comment.authorPatreonSupporter && <PatreonBadge size="sm" />}
              <span className="text-xs text-gray-400">
                {new Date(comment.createdAt).toLocaleDateString()}
              </span>
              {comment.edited && (
                <span className="text-xs text-gray-500 italic">(edited)</span>
              )}
            </div>

            {/* Comment Content */}
            {isEditing ? (
              <div className="mt-2">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full bg-gray-900 text-white border border-gray-600 rounded p-2 min-h-[80px]"
                  autoFocus
                />
                <div className="flex gap-2 mt-2">
                  <Button size="sm" color="primary" onClick={handleEdit}>
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="flat"
                    onClick={() => {
                      setIsEditing(false);
                      setEditContent(comment.content);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p
                className={`mt-2 text-gray-300 whitespace-pre-wrap ${isDeleted ? "italic text-gray-500" : ""}`}
              >
                {comment.content}
              </p>
            )}

            {/* Comment Actions */}
            {!isDeleted && (
              <div className="flex items-center gap-4 mt-3 text-sm">
                {/* Vote buttons */}
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="light"
                    className="min-w-0 px-2 text-white"
                    onClick={() => handleVote("UPVOTE")}
                  >
                    👍 {comment.stats?.upvotes || 0}
                  </Button>
                  <Button
                    size="sm"
                    variant="light"
                    className="min-w-0 px-2 text-white"
                    onClick={() => handleVote("DOWNVOTE")}
                  >
                    👎 {comment.stats?.downvotes || 0}
                  </Button>
                </div>

                {/* Reply button */}
                {currentUserId && (
                  <Button
                    size="sm"
                    variant="light"
                    className="text-white"
                    onClick={() => setIsReplying(!isReplying)}
                  >
                    Reply
                  </Button>
                )}

                {/* Edit/Delete for author */}
                {isAuthor && (
                  <>
                    <Button
                      size="sm"
                      variant="light"
                      onClick={() => setIsEditing(true)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="light"
                      color="danger"
                      onClick={handleDelete}
                    >
                      Delete
                    </Button>
                  </>
                )}

                {/* Reply count */}
                {hasReplies && (
                  <span className="text-gray-400 text-xs">
                    {comment.replies.length}{" "}
                    {comment.replies.length === 1 ? "reply" : "replies"}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Reply Form */}
        {isReplying && (
          <div className="mt-3 pl-11">
            <CommentForm
              onSubmit={handleReply}
              onCancel={() => setIsReplying(false)}
              placeholder="Write a reply..."
              submitLabel="Reply"
            />
          </div>
        )}
      </div>

      {/* Nested Replies */}
      {hasReplies && comment.replies && (
        <div className="mt-2">
          <Accordion>
            <AccordionItem
              key="replies"
              title={
                <span className="text-sm text-gray-400">
                  {showReplies ? "Hide" : "Show"} {comment.replies.length}{" "}
                  {comment.replies.length === 1 ? "reply" : "replies"}
                </span>
              }
              onPress={() => setShowReplies(!showReplies)}
            >
              <div className="space-y-2">
                {comment.replies.map((reply) => (
                  <CommentThread
                    key={reply.commentId}
                    comment={reply}
                    storyId={storyId}
                    nodeId={nodeId}
                    depth={depth + 1}
                    onReply={onReply}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onVote={onVote}
                    currentUserId={currentUserId}
                  />
                ))}

                {/* Show "Load More Replies" if there are more than displayed */}
                {comment.stats &&
                  comment.replies &&
                  comment.stats.totalReplyCount > comment.replies.length && (
                    <div className="text-center pt-2">
                      <Button
                        size="sm"
                        variant="light"
                        className="text-gray-400 hover:text-white"
                      >
                        Load{" "}
                        {comment.stats.totalReplyCount - comment.replies.length}{" "}
                        more{" "}
                        {comment.stats.totalReplyCount -
                          comment.replies.length ===
                        1
                          ? "reply"
                          : "replies"}
                      </Button>
                    </div>
                  )}
              </div>
            </AccordionItem>
          </Accordion>
        </div>
      )}
    </div>
  );
}
