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
import { Loader2, Trash2 } from "lucide-react";

interface Post {
  _id: string;
  title: string;
  content: string;
  status: string;
  trustScore: number;
  interactionCount: number;
  media: string[];
  createdAt: string;
}

export function PostDetail({ postId }: { postId: string }) {
  const router = useRouter();
  const { apiFetch } = useApi();
  const { isAuthenticated } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/posts/${postId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setPost(data.post);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load post");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [postId]);

  async function handleDelete() {
    if (!confirm("Are you sure? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/posts/${postId}`, { method: "DELETE" });
      router.push("/feed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
      setDeleting(false);
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
                onRated={(score) => setPost((p) => p ? { ...p, trustScore: score, interactionCount: p.interactionCount + 1 } : p)}
              />
            </>
          )}

          {isAuthenticated && (
            <div className="flex justify-end">
              <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting}>
                {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 data-icon="inline-start" className="size-4" />}
                {deleting ? "Deleting..." : "Delete Post"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <RelationList postId={postId} />
    </div>
  );
}
