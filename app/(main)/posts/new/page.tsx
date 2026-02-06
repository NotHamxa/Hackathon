"use client";

import { useAuth } from "@/hooks/use-auth";
import { PostForm } from "@/components/posts/post-form";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function NewPostPage() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <Card>
        <CardContent className="py-8 text-center flex flex-col gap-4 items-center">
          <p className="text-muted-foreground">You need to be logged in to create a post.</p>
          <Button asChild>
            <Link href="/register">Get Started</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return <PostForm />;
}
