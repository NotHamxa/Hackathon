"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusConfig: Record<string, { label: string; className: string }> = {
  open: { label: "Open", className: "bg-blue-500/10 text-blue-700 dark:text-blue-400" },
  verified: { label: "Verified", className: "bg-green-500/10 text-green-700 dark:text-green-400" },
  false: { label: "False", className: "bg-red-500/10 text-red-700 dark:text-red-400" },
  disputed: { label: "Disputed", className: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400" },
  deleted: { label: "Deleted", className: "bg-muted text-muted-foreground" },
};

export function PostStatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] ?? statusConfig.open;
  return (
    <Badge variant="outline" className={cn("border-0", config.className)}>
      {config.label}
    </Badge>
  );
}
