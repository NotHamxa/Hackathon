"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Copy, Check, AlertTriangle } from "lucide-react";

interface TokenDisplayProps {
  token: string;
}

export function TokenDisplay({ token }: TokenDisplayProps) {
  const router = useRouter();
  const { setToken } = useAuth();
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleContinue() {
    setToken(token);
    router.push("/feed");
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Your Identity Token</CardTitle>
        <CardDescription>
          This is your anonymous identity. Save it somewhere safe.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="bg-muted rounded-lg p-3 font-mono text-xs break-all leading-relaxed select-all">
          {token}
        </div>

        <Button variant="outline" onClick={handleCopy}>
          {copied ? (
            <Check data-icon="inline-start" className="size-4 text-green-600" />
          ) : (
            <Copy data-icon="inline-start" className="size-4" />
          )}
          {copied ? "Copied!" : "Copy Token"}
        </Button>

        <div className="flex items-start gap-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-3 text-sm text-yellow-700 dark:text-yellow-400">
          <AlertTriangle className="size-4 mt-0.5 shrink-0" />
          <div>
            <strong>Save this token now.</strong> It cannot be recovered. If you lose it,
            you lose access to your account permanently.
          </div>
        </div>

        <Button onClick={handleContinue}>
          I&apos;ve Saved My Token — Continue
        </Button>
      </CardContent>
    </Card>
  );
}
