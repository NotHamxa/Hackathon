"use client";

import { useEffect, useState } from "react";
import { RelationCard } from "./relation-card";
import { LinkRelationForm } from "./link-relation-form";
import { useAuth } from "@/hooks/use-auth";
import { Link2 } from "lucide-react";

interface Relation {
  _id: string;
  targetPostId: {
    _id: string;
    title: string;
    status: string;
    trustScore: number;
  };
  upvotes: number;
  downvotes: number;
}

interface RelationListProps {
  postId: string;
}

export function RelationList({ postId }: RelationListProps) {
  const { isAuthenticated } = useAuth();
  const [relations, setRelations] = useState<Relation[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchRelations() {
    try {
      const res = await fetch(`/api/posts/${postId}/relations`);
      const data = await res.json();
      setRelations(data.relations || []);
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRelations();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Link2 className="size-4 text-muted-foreground" />
        <h3 className="text-sm font-medium">Linked Evidence ({relations.length})</h3>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading relations...</p>
      ) : relations.length === 0 ? (
        <p className="text-sm text-muted-foreground">No evidence linked yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {relations.map((rel) => (
            <RelationCard key={rel._id} relation={rel} />
          ))}
        </div>
      )}

      {isAuthenticated && (
        <LinkRelationForm postId={postId} onLinked={fetchRelations} />
      )}
    </div>
  );
}
