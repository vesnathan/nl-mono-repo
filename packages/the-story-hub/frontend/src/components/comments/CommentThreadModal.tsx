"use client";

import { Modal, ModalContent, ModalHeader, ModalBody } from "@nextui-org/react";
import { CommentThread } from "./CommentThread";

interface Comment {
  commentId: string;
  storyId: string;
  nodeId: string;
  authorId: string;
  authorName: string;
  authorPatreonSupporter?: boolean;
  authorOGSupporter?: boolean;
  content: string;
  parentCommentId?: string | null;
  depth: number;
  createdAt: string;
  updatedAt: string;
  edited: boolean;
  stats?: {
    upvotes: number;
    downvotes: number;
    replyCount: number;
    totalReplyCount: number;
  };
  replies?: Comment[];
}

interface CommentThreadModalProps {
  isOpen: boolean;
  onClose: () => void;
  comment: Comment;
  storyId: string;
  nodeId: string;
  onReply: (parentCommentId: string, content: string) => Promise<void>;
  onEdit: (commentId: string, content: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
  onVote: (commentId: string, voteType: "UPVOTE" | "DOWNVOTE") => Promise<void>;
  currentUserId?: string;
  storyAuthorId?: string;
}

export function CommentThreadModal({
  isOpen,
  onClose,
  comment,
  storyId,
  nodeId,
  onReply,
  onEdit,
  onDelete,
  onVote,
  currentUserId,
  storyAuthorId,
}: CommentThreadModalProps) {
  // Count total replies in thread
  const countTotalReplies = (c: Comment): number => {
    let count = c.replies?.length || 0;
    c.replies?.forEach((reply) => {
      count += countTotalReplies(reply);
    });
    return count;
  };

  const totalReplies = countTotalReplies(comment);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="3xl"
      scrollBehavior="inside"
      classNames={{
        base: "bg-gray-900",
        header: "border-b border-gray-700",
        body: "py-6",
        closeButton: "hover:bg-gray-800",
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h3 className="text-xl font-bold text-white">Comment Thread</h3>
          <p className="text-sm text-gray-400">
            {totalReplies} {totalReplies === 1 ? "reply" : "replies"} in this
            thread
          </p>
        </ModalHeader>
        <ModalBody>
          <CommentThread
            comment={comment}
            storyId={storyId}
            nodeId={nodeId}
            onReply={onReply}
            onEdit={onEdit}
            onDelete={onDelete}
            onVote={onVote}
            currentUserId={currentUserId}
            isInModal={true}
            storyAuthorId={storyAuthorId}
          />
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
