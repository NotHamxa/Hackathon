"use client";

import { useEffect, useState } from "react";
import { useApi } from "@/hooks/use-api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Shield, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileData {
  credibility: number;
  isOnCooldown: boolean;
  cooldownUntil: string | null;
  createdAt: string;
}

export function CredibilityCard() {
  const { apiFetch } = useApi();
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const result = await apiFetch("/api/auth/me");
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load profile");
      } finally {
        setLoading(false);
      }
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading profile...
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-destructive">
          {error || "Failed to load profile"}
        </CardContent>
      </Card>
    );
  }

  const credColor =
    data.credibility >= 8 ? "text-green-600 dark:text-green-400" :
    data.credibility >= 5 ? "text-yellow-600 dark:text-yellow-400" :
    data.credibility >= 1 ? "text-orange-600 dark:text-orange-400" :
    "text-red-600 dark:text-red-400";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="size-5" />
          Your Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Credibility Score</span>
          <span className={cn("text-2xl font-bold tabular-nums", credColor)}>
            {data.credibility.toFixed(1)}
          </span>
        </div>

        {data.isOnCooldown && data.cooldownUntil && (
          <div className="flex items-start gap-2 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-700 dark:text-red-400">
            <Clock className="size-4 mt-0.5 shrink-0" />
            <div>
              <strong>On Cooldown</strong>
              <p className="mt-0.5">
                You cannot post or rate until{" "}
                {new Date(data.cooldownUntil).toLocaleDateString()} at{" "}
                {new Date(data.cooldownUntil).toLocaleTimeString()}.
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Member since</span>
          <span>{new Date(data.createdAt).toLocaleDateString()}</span>
        </div>
      </CardContent>
    </Card>
  );
}
