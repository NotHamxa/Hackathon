"use client";

import { cn } from "@/lib/utils";

function getScoreColor(score: number): string {
  if (score >= 4.0) return "text-green-600 dark:text-green-400";
  if (score >= 3.0) return "text-yellow-600 dark:text-yellow-400";
  if (score >= 2.0) return "text-orange-600 dark:text-orange-400";
  return "text-red-600 dark:text-red-400";
}

export function TrustScoreDisplay({ score, className }: { score: number; className?: string }) {
  return (
    <span
      className={cn("font-semibold tabular-nums", getScoreColor(score), className)}
      title={`Trust Score: ${score.toFixed(2)}`}
    >
      {score.toFixed(1)}
    </span>
  );
}
