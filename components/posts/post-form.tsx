"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/use-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export function PostForm() {
  const router = useRouter();
  const { apiFetch } = useApi();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await apiFetch("/api/posts", {
        method: "POST",
        body: JSON.stringify({ title, content }),
      });
      router.push(`/posts/${data.post._id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create post");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Share a Rumor</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="What's the rumor?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="content">Details</Label>
            <Textarea
              id="content"
              placeholder="Provide more context..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={5000}
              required
              className="min-h-32"
            />
          </div>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <Button type="submit" disabled={loading || !title.trim() || !content.trim()}>
            {loading && <Loader2 className="size-4 animate-spin" />}
            {loading ? "Posting..." : "Post Rumor"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
