"use client";

import { useSearchParams } from "next/navigation";
import { VerifyForm } from "@/components/auth/verify-form";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Suspense } from "react";

function VerifyContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  if (!email) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">
            No email provided.{" "}
            <Link href="/register" className="text-primary underline">
              Go back to register
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    );
  }

  return <VerifyForm email={email} />;
}

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyContent />
    </Suspense>
  );
}
