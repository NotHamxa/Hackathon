"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/use-api";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardHeader, CardTitle, CardContent, CardAction } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PostStatusBadge } from "./post-status-badge";
import { TrustScoreDisplay } from "./trust-score-display";
import { InteractionSummary } from "@/components/interactions/interaction-summary";
import { RatingInput } from "@/components/interactions/rating-input";
import { RelationList } from "@/components/relations/relation-list";
import { Separator } from "@/components/ui/separator";
import { Loader2, Flag, MessageSquare } from "lucide-react";
import { ratingLabels, ratingBadgeColors } from "@/lib/rating-config";
import { cn } from "@/lib/utils";

interface Post {
  _id: string;
  title: string;
  content: string;
  status: string;
  trustScore: number;
  interactionCount: number;
  media: string[];
  createdAt: string;
  flagCount?: number;
}

interface Comment {
  _id: string;
  rating: number;
  comment: string;
  createdAt: string;
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export function PostDetail({ postId }: { postId: string }) {
  const router = useRouter();
  const { apiFetch } = useApi();
  const { isAuthenticated } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Existing rating
  const [myRating, setMyRating] = useState<number | null>(null);

  // Comments
  const [comments, setComments] = useState<Comment[]>([]);

  // Flagging
  const [flagCount, setFlagCount] = useState(0);
  const [userFlagged, setUserFlagged] = useState(false);
  const [flagging, setFlagging] = useState(false);
  const [showFlagInput, setShowFlagInput] = useState(false);
  const [flagReason, setFlagReason] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/posts/${postId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setPost(data.post);
        setFlagCount(data.post.flagCount || 0);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load post");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [postId]);

  // Fetch existing rating + flag status
  useEffect(() => {
    if (!isAuthenticated || !post) return;

    apiFetch(`/api/posts/my-interactions?postIds=${postId}`)
      .then((data) => {
        if (data.interactions?.[postId]) {
          setMyRating(data.interactions[postId]);
        }
      })
      .catch(() => {});

    apiFetch(`/api/posts/${postId}/flag`)
      .then((data) => {
        setFlagCount(data.flagCount);
        setUserFlagged(data.userFlagged);
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, post?._id]);

  // Fetch comments
  useEffect(() => {
    if (!post) return;
    fetch(`/api/posts/${postId}/comments`)
      .then((res) => res.json())
      .then((data) => setComments(data.comments || []))
      .catch(() => {});
  }, [post, postId]);

  async function handleFlag() {
    setFlagging(true);
    try {
      const body: { reason?: string } = {};
      if (flagReason.trim()) body.reason = flagReason.trim();

      const data = await apiFetch(`/api/posts/${postId}/flag`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      setUserFlagged(true);
      setFlagCount(data.flagCount);
      setShowFlagInput(false);
      if (data.deleted) {
        router.push("/feed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to flag post");
    } finally {
      setFlagging(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-destructive">
          {error || "Post not found"}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>{post.title}</CardTitle>
          <CardAction>
            <PostStatusBadge status={post.status} />
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="whitespace-pre-wrap">{post.content}</p>

          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Trust Score:</span>
              <TrustScoreDisplay score={post.trustScore} className="text-base" />
            </div>
            <InteractionSummary interactionCount={post.interactionCount} />
            <span className="ml-auto text-xs text-muted-foreground">
              {new Date(post.createdAt).toLocaleDateString()}
            </span>
          </div>

          {isAuthenticated && post.status === "open" && (
            <>
              <Separator />
              <RatingInput
                postId={postId}
                existingRating={myRating}
                onRated={(score) => setPost((p) => p ? { ...p, trustScore: score, interactionCount: p.interactionCount + 1 } : p)}
              />
            </>
          )}

          {isAuthenticated && (
            <div className="flex items-center justify-end gap-2">
              <span className="text-xs text-muted-foreground">
                <Flag className="size-3 inline" /> {flagCount}
              </span>
              {userFlagged ? (
                <Button variant="outline" size="sm" disabled>
                  <Flag className="size-4" />
                  Flagged
                </Button>
              ) : showFlagInput ? (
                <div className="flex flex-col gap-2 w-full">
                  <textarea
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                    placeholder="Reason for flagging (optional, max 500 chars)..."
                    rows={2}
                    maxLength={500}
                    value={flagReason}
                    onChange={(e) => setFlagReason(e.target.value)}
                    disabled={flagging}
                  />
                  <div className="flex gap-2 justify-end">
                    <Button variant="ghost" size="sm" onClick={() => setShowFlagInput(false)} disabled={flagging}>
                      Cancel
                    </Button>
                    <Button variant="destructive" size="sm" onClick={handleFlag} disabled={flagging}>
                      {flagging ? <Loader2 className="size-4 animate-spin" /> : <Flag className="size-4" />}
                      Confirm Flag
                    </Button>
                  </div>
                </div>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setShowFlagInput(true)}>
                  <Flag className="size-4" />
                  Flag Post
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comments Section */}
      {comments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="size-4" />
              Comments ({comments.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {comments.map((c) => (
              <div key={c._id} className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", ratingBadgeColors[c.rating])}>
                    {c.rating} — {ratingLabels[c.rating]}
                  </span>
                  <span className="text-xs text-muted-foreground">{timeAgo(c.createdAt)}</span>
                </div>
                <p className="text-sm pl-1">{c.comment}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <RelationList postId={postId} />
    </div>
  );
}
