"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useApi } from "@/hooks/use-api";
import { PostCard } from "@/components/posts/post-card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface Post {
  _id: string;
  title: string;
  content: string;
  status: string;
  trustScore: number;
  interactionCount: number;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function FeedPage() {
  const { isAuthenticated } = useAuth();
  const { apiFetch } = useApi();
  const [posts, setPosts] = useState<Post[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string>("");
  const [sort, setSort] = useState<string>("recent");
  const [page, setPage] = useState(1);
  const [myInteractions, setMyInteractions] = useState<Record<string, number>>({});

  async function fetchPosts() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), sort });
      if (status) params.set("status", status);

      const res = await fetch(`/api/posts?${params}`);
      const data = await res.json();
      const fetchedPosts: Post[] = data.posts || [];
      setPosts(fetchedPosts);
      setPagination(data.pagination || null);

      // Fetch user's interactions for these posts
      if (isAuthenticated && fetchedPosts.length > 0) {
        const ids = fetchedPosts.map((p) => p._id).join(",");
        try {
          const ixData = await apiFetch(`/api/posts/my-interactions?postIds=${ids}`);
          setMyInteractions(ixData.interactions || {});
        } catch {
          setMyInteractions({});
        }
      } else {
        setMyInteractions({});
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPosts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status, sort, isAuthenticated]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Feed</h1>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="flex gap-1">
          {["", "open", "verified", "false", "disputed"].map((s) => (
            <Button
              key={s}
              variant={status === s ? "default" : "outline"}
              size="xs"
              onClick={() => { setStatus(s); setPage(1); }}
            >
              {s || "All"}
            </Button>
          ))}
        </div>
        <div className="flex gap-1 ml-auto">
          {[
            { value: "recent", label: "Recent" },
            { value: "trust", label: "Trust" },
            { value: "interactions", label: "Popular" },
          ].map((s) => (
            <Button
              key={s.value}
              variant={sort === s.value ? "secondary" : "ghost"}
              size="xs"
              onClick={() => { setSort(s.value); setPage(1); }}
            >
              {s.label}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : posts.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">
          No posts yet. Be the first to share a rumor.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {posts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              myRating={myInteractions[post._id] || null}
            />
          ))}
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
