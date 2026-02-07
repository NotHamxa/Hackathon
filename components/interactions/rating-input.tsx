"use client";

import { useState } from "react";
import { useApi } from "@/hooks/use-api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { ratingLabels, ratingColors } from "@/lib/rating-config";

interface RatingInputProps {
  postId: string;
  existingRating?: number | null;
  onRated?: (trustScore: number) => void;
}

export function RatingInput({ postId, existingRating, onRated }: RatingInputProps) {
  const { apiFetch } = useApi();
  const [selected, setSelected] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  if (existingRating) {
    return (
      <div className="text-sm text-muted-foreground">
        You rated this post: <strong>{ratingLabels[existingRating]}</strong>
      </div>
    );
  }

  async function handleSubmit() {
    if (!selected) return;
    setError(null);
    setLoading(true);

    try {
      const body: { rating: number; comment?: string } = { rating: selected };
      if (comment.trim()) body.comment = comment.trim();

      const data = await apiFetch(`/api/posts/${postId}/interact`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      setSubmitted(true);
      onRated?.(data.trustScore);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit rating");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="text-sm text-muted-foreground">
        You rated this post: <strong>{ratingLabels[selected!]}</strong>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium">Rate this rumor</p>
      <div className="flex flex-wrap gap-1.5">
        {[1, 2, 3, 4, 5].map((rating) => (
          <Button
            key={rating}
            variant="outline"
            size="sm"
            disabled={loading}
            data-selected={selected === rating ? "" : undefined}
            className={cn(ratingColors[rating])}
            onClick={() => setSelected(rating)}
          >
            {rating} — {ratingLabels[rating]}
          </Button>
        ))}
      </div>

      {selected && (
        <div className="flex flex-col gap-2">
          <textarea
            className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            placeholder="Add an optional comment (max 500 chars)..."
            rows={3}
            maxLength={500}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={loading}
          />
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleSubmit} disabled={loading}>
              {loading && <Loader2 className="size-3 animate-spin" />}
              Submit Rating
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setSelected(null); setComment(""); }}
              disabled={loading}
            >
              Cancel
            </Button>
            {comment.length > 0 && (
              <span className="text-xs text-muted-foreground ml-auto">
                {comment.length}/500
              </span>
            )}
          </div>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
