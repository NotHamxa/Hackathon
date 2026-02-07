"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Ear, Users, TrendingUp, Lock } from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) router.replace("/feed");
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2 font-semibold">
            <Ear className="size-5 text-primary" />
            <span>Unheard</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/feed">Feed</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-2xl text-center flex flex-col gap-8 py-20">
          <div className="flex flex-col gap-4">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Anonymous Campus
              <br />
              Rumor Verification
            </h1>
            <p className="text-lg text-muted-foreground max-w-lg mx-auto">
              No admins. No identities. Just math and collective judgment.
              Share and verify campus rumors anonymously.
            </p>
          </div>

          <div className="flex justify-center gap-3">
            <Button size="lg" asChild>
              <Link href="/register">Join Unheard</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/feed">Browse Feed</Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left mt-8">
            <div className="flex flex-col gap-2">
              <Lock className="size-5 text-primary" />
              <h3 className="font-medium">Truly Anonymous</h3>
              <p className="text-sm text-muted-foreground">
                Your email is used once for verification, then permanently deleted. Only cryptographic hashes remain.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <TrendingUp className="size-5 text-primary" />
              <h3 className="font-medium">Trust Scoring</h3>
              <p className="text-sm text-muted-foreground">
                Credibility-weighted ratings ensure truth wins over popularity. Good judgment is rewarded.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Users className="size-5 text-primary" />
              <h3 className="font-medium">Community Driven</h3>
              <p className="text-sm text-muted-foreground">
                No moderators decide truth. The community collectively verifies claims through linked evidence.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
