"use client";

import { useAuth } from "@/hooks/use-auth";
import { CredibilityCard } from "@/components/profile/credibility-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useState } from "react";
import { KeyRound } from "lucide-react";

export default function ProfilePage() {
  const { isAuthenticated, setToken } = useAuth();
  const [tokenInput, setTokenInput] = useState("");

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="size-5" />
              Enter Your Token
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              If you already have a token, enter it here to log in.
            </p>
            <div className="flex flex-col gap-2">
              <Label htmlFor="token">Identity Token</Label>
              <Input
                id="token"
                type="password"
                placeholder="Paste your 256-bit token..."
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                className="font-mono"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => { if (tokenInput.trim()) setToken(tokenInput.trim()); }}
                disabled={!tokenInput.trim()}
              >
                Log In
              </Button>
              <Button variant="outline" asChild>
                <Link href="/register">Register Instead</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <CredibilityCard />
    </div>
  );
}
