"use client";

import { useState } from "react";
import { useApi } from "@/hooks/use-api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const ratingLabels: Record<number, string> = {
  1: "Completely False",
  2: "Probably False",
  3: "Uncertain",
  4: "Probably True",
  5: "Completely True",
};

const ratingColors: Record<number, string> = {
  1: "hover:bg-red-500/10 hover:text-red-700 data-[selected]:bg-red-500/15 data-[selected]:text-red-700 dark:hover:text-red-400 dark:data-[selected]:text-red-400",
  2: "hover:bg-orange-500/10 hover:text-orange-700 data-[selected]:bg-orange-500/15 data-[selected]:text-orange-700 dark:hover:text-orange-400 dark:data-[selected]:text-orange-400",
  3: "hover:bg-yellow-500/10 hover:text-yellow-700 data-[selected]:bg-yellow-500/15 data-[selected]:text-yellow-700 dark:hover:text-yellow-400 dark:data-[selected]:text-yellow-400",
  4: "hover:bg-lime-500/10 hover:text-lime-700 data-[selected]:bg-lime-500/15 data-[selected]:text-lime-700 dark:hover:text-lime-400 dark:data-[selected]:text-lime-400",
  5: "hover:bg-green-500/10 hover:text-green-700 data-[selected]:bg-green-500/15 data-[selected]:text-green-700 dark:hover:text-green-400 dark:data-[selected]:text-green-400",
};

interface RatingInputProps {
  postId: string;
  onRated?: (trustScore: number) => void;
}

export function RatingInput({ postId, onRated }: RatingInputProps) {
  const { apiFetch } = useApi();
  const [selected, setSelected] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function handleRate(rating: number) {
    setSelected(rating);
    setError(null);
    setLoading(true);

    try {
      const data = await apiFetch(`/api/posts/${postId}/interact`, {
        method: "POST",
        body: JSON.stringify({ rating }),
      });
      setSubmitted(true);
      onRated?.(data.trustScore);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit rating");
      setSelected(null);
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
    <div className="flex flex-col gap-2">
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
            onClick={() => handleRate(rating)}
          >
            {loading && selected === rating && <Loader2 className="size-3 animate-spin" />}
            {rating} — {ratingLabels[rating]}
          </Button>
        ))}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
