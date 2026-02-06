"use client";

import { useState } from "react";
import { useApi } from "@/hooks/use-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, Search, Loader2 } from "lucide-react";

interface LinkRelationFormProps {
  postId: string;
  onLinked?: () => void;
}

interface SearchResult {
  _id: string;
  title: string;
  status: string;
}

export function LinkRelationForm({ postId, onLinked }: LinkRelationFormProps) {
  const { apiFetch } = useApi();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [linking, setLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch() {
    if (!query.trim()) return;
    setSearching(true);
    setError(null);
    try {
      const data = await apiFetch(`/api/posts?limit=10&page=1`);
      // Filter client-side for simplicity
      const filtered = (data.posts as SearchResult[]).filter(
        (p) =>
          p._id !== postId &&
          p.status !== "deleted" &&
          p.title.toLowerCase().includes(query.toLowerCase())
      );
      setResults(filtered);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setSearching(false);
    }
  }

  async function handleLink(targetPostId: string) {
    setLinking(true);
    setError(null);
    try {
      await apiFetch(`/api/posts/${postId}/relations`, {
        method: "POST",
        body: JSON.stringify({ targetPostId }),
      });
      setOpen(false);
      setQuery("");
      setResults([]);
      onLinked?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to link");
    } finally {
      setLinking(false);
    }
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <PlusCircle data-icon="inline-start" className="size-4" />
        Link Evidence
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border p-3">
      <div className="flex gap-2">
        <Input
          placeholder="Search posts to link..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <Button variant="outline" size="default" onClick={handleSearch} disabled={searching}>
          {searching ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
        </Button>
      </div>
      {results.length > 0 && (
        <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
          {results.map((post) => (
            <button
              key={post._id}
              disabled={linking}
              onClick={() => handleLink(post._id)}
              className="text-left text-sm px-2 py-1.5 rounded hover:bg-muted transition-colors line-clamp-1"
            >
              {post.title}
            </button>
          ))}
        </div>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
      <Button variant="ghost" size="sm" onClick={() => { setOpen(false); setResults([]); }}>
        Cancel
      </Button>
    </div>
  );
}
