"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardAction } from "@/components/ui/card";
import { PostStatusBadge } from "./post-status-badge";
import { TrustScoreDisplay } from "./trust-score-display";
import { MessageSquare } from "lucide-react";
import { ratingLabels, ratingBadgeColors } from "@/lib/rating-config";
import { cn } from "@/lib/utils";

interface PostCardProps {
  post: {
    _id: string;
    title: string;
    content: string;
    status: string;
    trustScore: number;
    interactionCount: number;
    createdAt: string;
  };
  myRating?: number | null;
}

export function PostCard({ post, myRating }: PostCardProps) {
  return (
    <Link href={`/posts/${post._id}`}>
      <Card className="hover:ring-foreground/20 transition-all cursor-pointer">
        <CardHeader>
          <CardTitle className="line-clamp-1">{post.title}</CardTitle>
          <CardDescription className="line-clamp-2">{post.content}</CardDescription>
          <CardAction>
            <PostStatusBadge status={post.status} />
          </CardAction>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <span className="text-xs">Trust:</span>
              <TrustScoreDisplay score={post.trustScore} />
            </div>
            <div className="flex items-center gap-1">
              <MessageSquare className="size-3.5" />
              <span>{post.interactionCount}</span>
            </div>
            {myRating && (
              <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", ratingBadgeColors[myRating])}>
                Rated: {ratingLabels[myRating]}
              </span>
            )}
            <span className="ml-auto text-xs">
              {new Date(post.createdAt).toLocaleDateString()}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
