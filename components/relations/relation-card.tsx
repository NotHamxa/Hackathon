"use client";

import { useState } from "react";
import Link from "next/link";
import { useApi } from "@/hooks/use-api";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { PostStatusBadge } from "@/components/posts/post-status-badge";
import { ThumbsUp, ThumbsDown } from "lucide-react";

interface RelationCardProps {
  relation: {
    _id: string;
    targetPostId: {
      _id: string;
      title: string;
      status: string;
      trustScore: number;
    };
    upvotes: number;
    downvotes: number;
  };
}

export function RelationCard({ relation }: RelationCardProps) {
  const { apiFetch } = useApi();
  const { isAuthenticated } = useAuth();
  const [upvotes, setUpvotes] = useState(relation.upvotes);
  const [downvotes, setDownvotes] = useState(relation.downvotes);
  const [voted, setVoted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleVote(vote: "up" | "down") {
    setError(null);
    try {
      const data = await apiFetch(`/api/relations/${relation._id}/vote`, {
        method: "POST",
        body: JSON.stringify({ vote }),
      });
      setUpvotes(data.upvotes);
      setDownvotes(data.downvotes);
      setVoted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to vote");
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border p-3">
      <div className="flex-1 min-w-0">
        <Link
          href={`/posts/${relation.targetPostId._id}`}
          className="text-sm font-medium hover:underline line-clamp-1"
        >
          {relation.targetPostId.title}
        </Link>
        <div className="flex items-center gap-2 mt-1">
          <PostStatusBadge status={relation.targetPostId.status} />
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {isAuthenticated && !voted && (
          <>
            <Button variant="ghost" size="icon-xs" onClick={() => handleVote("up")} title="Relevant">
              <ThumbsUp className="size-3.5" />
            </Button>
            <Button variant="ghost" size="icon-xs" onClick={() => handleVote("down")} title="Not relevant">
              <ThumbsDown className="size-3.5" />
            </Button>
          </>
        )}
        <span className="text-xs text-muted-foreground tabular-nums min-w-[3ch] text-center">
          {upvotes - downvotes > 0 ? "+" : ""}{upvotes - downvotes}
        </span>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
