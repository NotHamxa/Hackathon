"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Ear, PlusCircle, User, LogOut, Home } from "lucide-react";

export function Header() {
  const { isAuthenticated, logout } = useAuth();

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Ear className="size-5 text-primary" />
          <span>Unheard</span>
        </Link>

        <nav className="flex items-center gap-1">
          {isAuthenticated ? (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/feed">
                  <Home data-icon="inline-start" className="size-4" />
                  Feed
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/posts/new">
                  <PlusCircle data-icon="inline-start" className="size-4" />
                  New Post
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/profile">
                  <User data-icon="inline-start" className="size-4" />
                  Profile
                </Link>
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={logout} title="Logout">
                <LogOut className="size-4" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/feed">Feed</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/register">Get Started</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
