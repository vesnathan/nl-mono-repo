"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { voteOnChapterAPI } from "@/lib/api/chapters";
import { VoteType } from "@/types/gqlTypes";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@nextui-org/react";

interface VoteButtonsProps {
  storyId: string;
  nodeId: string;
  upvotes: number;
  downvotes: number;
  onVoteSuccess?: () => void;
}

export function VoteButtons({
  storyId,
  nodeId,
  upvotes,
  downvotes,
  onVoteSuccess,
}: VoteButtonsProps) {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [votingType, setVotingType] = useState<VoteType | null>(null);

  const voteMutation = useMutation({
    mutationFn: ({ voteType }: { voteType: VoteType }) =>
      voteOnChapterAPI(storyId, nodeId, voteType),
    onSuccess: () => {
      // Invalidate queries to refetch updated vote counts
      queryClient.invalidateQueries({ queryKey: ["listBranches", storyId] });
      queryClient.invalidateQueries({ queryKey: ["chapter", storyId, nodeId] });
      setVotingType(null);
      onVoteSuccess?.();
    },
    onError: (error) => {
      console.error("Vote failed:", error);
      setVotingType(null);
    },
  });

  const handleVote = (voteType: VoteType, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent parent click handlers (like branch card navigation)
    if (!isAuthenticated) {
      // Could show a login prompt here
      return;
    }
    setVotingType(voteType);
    voteMutation.mutate({ voteType });
  };

  const isVoting = voteMutation.isPending;

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="light"
        isIconOnly
        isDisabled={isVoting}
        isLoading={votingType === VoteType.UP && isVoting}
        onPress={(e) =>
          handleVote(VoteType.UP, e as unknown as React.MouseEvent)
        }
        className="min-w-0 h-auto p-1 text-gray-400 hover:text-green-400 hover:bg-green-400/10"
        title={isAuthenticated ? "Upvote" : "Login to vote"}
      >
        👍
      </Button>
      <span className="text-sm text-gray-400 min-w-[2ch] text-center">
        {upvotes}
      </span>

      <Button
        size="sm"
        variant="light"
        isIconOnly
        isDisabled={isVoting}
        isLoading={votingType === VoteType.DOWN && isVoting}
        onPress={(e) =>
          handleVote(VoteType.DOWN, e as unknown as React.MouseEvent)
        }
        className="min-w-0 h-auto p-1 text-gray-400 hover:text-red-400 hover:bg-red-400/10"
        title={isAuthenticated ? "Downvote" : "Login to vote"}
      >
        👎
      </Button>
      <span className="text-sm text-gray-400 min-w-[2ch] text-center">
        {downvotes}
      </span>
    </div>
  );
}
