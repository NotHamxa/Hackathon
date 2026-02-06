"use client";

import { MessageSquare } from "lucide-react";

interface InteractionSummaryProps {
  interactionCount: number;
}

export function InteractionSummary({ interactionCount }: InteractionSummaryProps) {
  return (
    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <MessageSquare className="size-4" />
      <span>
        {interactionCount} {interactionCount === 1 ? "interaction" : "interactions"}
      </span>
    </div>
  );
}
